using System.Diagnostics;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Prestacontrol.Infrastructure.Persistence;

namespace Prestacontrol.API.Services;

public sealed class GoogleDriveBackupWorker : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleDriveBackupWorker> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IDataProtector _protector;

    public GoogleDriveBackupWorker(IConfiguration configuration, ILogger<GoogleDriveBackupWorker> logger, IHttpClientFactory httpClientFactory, IServiceScopeFactory scopeFactory, IDataProtectionProvider dataProtectionProvider)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _scopeFactory = scopeFactory;
        _protector = dataProtectionProvider.CreateProtector("PrestaControl.GoogleDrive.RefreshToken.v1");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (await IsBackupEnabled() && GetBool("BACKUP_RUN_ON_STARTUP", false))
            await RunBackupSafely(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(GetDelayUntilNextRun(), stoppingToken);
            if (!stoppingToken.IsCancellationRequested && await IsBackupEnabled())
                await RunBackupSafely(stoppingToken);
        }
    }

    private async Task<bool> IsBackupEnabled()
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var setting = await context.SystemConfigs.FindAsync("Backups.Enabled");
        return setting == null ? GetBool("BACKUP_ENABLED", false) : bool.TryParse(setting.Value, out var enabled) && enabled;
    }

    private async Task RunBackupSafely(CancellationToken cancellationToken)
    {
        try
        {
            var archive = await CreateEncryptedBackup(cancellationToken);
            await UploadToDrive(archive, cancellationToken);
            await ApplyRetention(cancellationToken);
            File.Delete(archive);
            _logger.LogInformation("Encrypted PrestaControl backup uploaded to Google Drive.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PrestaControl backup failed. No backup credentials or archive contents were written to the log.");
        }
    }

    private async Task<string> CreateEncryptedBackup(CancellationToken cancellationToken)
    {
        var work = Path.Combine(Path.GetTempPath(), "prestacontrol-backup", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(work);
        var plainArchive = Path.Combine(work, "prestacontrol-backup.tar.gz");
        var encryptedArchive = plainArchive + ".pca";
        var dump = Path.Combine(work, "database.sql");
        var environment = Path.Combine(work, "runtime-environment.json");

        try
        {
            await DumpDatabase(dump, cancellationToken);
            await File.WriteAllTextAsync(environment, JsonSerializer.Serialize(
                Environment.GetEnvironmentVariables().Cast<System.Collections.DictionaryEntry>()
                    .ToDictionary(e => e.Key.ToString()!, e => e.Value?.ToString() ?? string.Empty),
                new JsonSerializerOptions { WriteIndented = true }), cancellationToken);

            var source = Get("BACKUP_SOURCE_PATH", "/backup/source");
            var tarArgs = $"-czf {Quote(plainArchive)} -C {Quote(work)} database.sql runtime-environment.json";
            if (Directory.Exists(source)) tarArgs += $" -C {Quote(source)} .";
            await RunProcess("tar", tarArgs, cancellationToken);

            await EncryptFile(plainArchive, encryptedArchive, GetRequired("BACKUP_ENCRYPTION_PASSWORD"), cancellationToken);
            return encryptedArchive;
        }
        finally
        {
            File.Delete(plainArchive);
            File.Delete(dump);
            File.Delete(environment);
        }
    }

    private async Task DumpDatabase(string output, CancellationToken cancellationToken)
    {
        var psi = new ProcessStartInfo("mysqldump")
        {
            Arguments = $"--single-transaction --routines --events --triggers -h {Quote(Get("BACKUP_DB_HOST", "db"))} -P {Get("BACKUP_DB_PORT", "3306")} -u {Quote(Get("BACKUP_DB_USER", "root"))} {Quote(GetRequired("BACKUP_DB_NAME"))}",
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        psi.Environment["MYSQL_PWD"] = GetRequired("BACKUP_DB_PASSWORD");
        using var process = Process.Start(psi) ?? throw new InvalidOperationException("Could not start mysqldump.");
        await using (var file = File.Create(output)) await process.StandardOutput.BaseStream.CopyToAsync(file, cancellationToken);
        var error = await process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        if (process.ExitCode != 0) throw new InvalidOperationException($"mysqldump failed: {error}");
    }

    private async Task UploadToDrive(string archive, CancellationToken cancellationToken)
    {
        var token = await GetAccessToken(cancellationToken);
        var folder = GetRequired("BACKUP_GOOGLE_DRIVE_FOLDER_ID");
        await ValidateDriveFolder(folder, token, cancellationToken);
        var metadata = JsonSerializer.Serialize(new { name = $"prestacontrol-backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}.pca", parents = new[] { folder }, description = "Encrypted PrestaControl full backup" });
        using var content = new MultipartContent("related", "backup-boundary");
        var metadataPart = new StringContent(metadata, Encoding.UTF8, "application/json");
        var filePart = new StreamContent(File.OpenRead(archive));
        filePart.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(metadataPart);
        content.Add(filePart);
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true") { Content = content };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _httpClientFactory.CreateClient().SendAsync(request, cancellationToken);
        await EnsureSuccess(response, "uploading backup");
    }

    private async Task ValidateDriveFolder(string folder, string token, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://www.googleapis.com/drive/v3/files/{Uri.EscapeDataString(folder)}?fields=id,name,mimeType,trashed&supportsAllDrives=true");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var response = await _httpClientFactory.CreateClient().SendAsync(request, cancellationToken);
        await EnsureSuccess(response, "validating Google Drive backup folder");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        if (!json.RootElement.TryGetProperty("mimeType", out var type) || type.GetString() != "application/vnd.google-apps.folder")
            throw new InvalidOperationException("BACKUP_GOOGLE_DRIVE_FOLDER_ID no corresponde a una carpeta de Google Drive.");
    }

    private static async Task EnsureSuccess(HttpResponseMessage response, string operation)
    {
        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync();
        throw new HttpRequestException($"Google Drive error while {operation}: {(int)response.StatusCode} {response.ReasonPhrase}. {body}");
    }

    private async Task ApplyRetention(CancellationToken cancellationToken)
    {
        var retentionDays = GetInt("BACKUP_RETENTION_DAYS", 90);
        if (retentionDays <= 0) return;
        var token = await GetAccessToken(cancellationToken);
        var folder = GetRequired("BACKUP_GOOGLE_DRIVE_FOLDER_ID");
        var query = Uri.EscapeDataString($"'{folder}' in parents and trashed = false and name contains 'prestacontrol-backup-'");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://www.googleapis.com/drive/v3/files?q={query}&fields=files(id,name,createdTime)");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var document = JsonDocument.Parse(await (await _httpClientFactory.CreateClient().SendAsync(request, cancellationToken)).Content.ReadAsStringAsync(cancellationToken));
        var cutoff = DateTimeOffset.UtcNow.AddDays(-retentionDays);
        foreach (var file in document.RootElement.GetProperty("files").EnumerateArray())
        {
            if (file.GetProperty("createdTime").GetDateTimeOffset() >= cutoff) continue;
            using var delete = new HttpRequestMessage(HttpMethod.Delete, $"https://www.googleapis.com/drive/v3/files/{file.GetProperty("id").GetString()}");
            delete.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            (await _httpClientFactory.CreateClient().SendAsync(delete, cancellationToken)).EnsureSuccessStatusCode();
        }
    }

    private async Task<string> GetAccessToken(CancellationToken cancellationToken)
    {
        var refreshToken = await GetRefreshToken();
        using var response = await _httpClientFactory.CreateClient().PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = GetRequired("BACKUP_GOOGLE_CLIENT_ID"),
            ["client_secret"] = GetRequired("BACKUP_GOOGLE_CLIENT_SECRET"),
            ["refresh_token"] = refreshToken,
            ["grant_type"] = "refresh_token"
        }), cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        return document.RootElement.GetProperty("access_token").GetString()!;
    }

    private async Task<string> GetRefreshToken()
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var stored = await context.SystemConfigs.FindAsync("Backups.GoogleRefreshToken");
        if (stored != null && !string.IsNullOrWhiteSpace(stored.Value)) return _protector.Unprotect(stored.Value);
        return GetRequired("BACKUP_GOOGLE_REFRESH_TOKEN");
    }

    private static async Task EncryptFile(string input, string output, string password, CancellationToken cancellationToken)
    {
        var salt = RandomNumberGenerator.GetBytes(32); var iv = RandomNumberGenerator.GetBytes(16);
        using var key = new Rfc2898DeriveBytes(password, salt, 600_000, HashAlgorithmName.SHA256);
        using var aes = Aes.Create(); aes.Key = key.GetBytes(32); aes.IV = iv; aes.Mode = CipherMode.CBC; aes.Padding = PaddingMode.PKCS7;
        await using var destination = File.Create(output); await destination.WriteAsync(Encoding.ASCII.GetBytes("PCA1"), cancellationToken); await destination.WriteAsync(salt, cancellationToken); await destination.WriteAsync(iv, cancellationToken);
        await using var crypto = new CryptoStream(destination, aes.CreateEncryptor(), CryptoStreamMode.Write);
        await using var source = File.OpenRead(input); await source.CopyToAsync(crypto, cancellationToken); await crypto.FlushFinalBlockAsync(cancellationToken);
    }

    private TimeSpan GetDelayUntilNextRun()
    {
        if (double.TryParse(Get("BACKUP_INTERVAL_HOURS", "0"), out var hours) && hours > 0) return TimeSpan.FromHours(hours);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(Get("BACKUP_TIME_ZONE", "UTC"));
        var now = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, zone); var time = TimeSpan.TryParse(Get("BACKUP_TIME", "03:00"), out var parsed) ? parsed : TimeSpan.FromHours(3);
        var next = now.Date.Add(time); if (next <= now.DateTime) next = next.AddDays(1);
        return next - now.DateTime;
    }

    private static string Quote(string value) => $"\"{value.Replace("\"", "\\\"")}\"";
    private string Get(string name, string fallback) => Environment.GetEnvironmentVariable(name) ?? _configuration[name] ?? fallback;
    private string GetRequired(string name) => string.IsNullOrWhiteSpace(Get(name, "")) ? throw new InvalidOperationException($"Missing required backup setting: {name}") : Get(name, "");
    private bool GetBool(string name, bool fallback) => bool.TryParse(Get(name, fallback.ToString()), out var value) && value;
    private int GetInt(string name, int fallback) => int.TryParse(Get(name, fallback.ToString()), out var value) ? value : fallback;
    private static async Task RunProcess(string fileName, string arguments, CancellationToken cancellationToken)
    {
        using var process = Process.Start(new ProcessStartInfo(fileName, arguments) { RedirectStandardError = true, UseShellExecute = false, CreateNoWindow = true }) ?? throw new InvalidOperationException($"Could not start {fileName}.");
        var error = await process.StandardError.ReadToEndAsync(cancellationToken); await process.WaitForExitAsync(cancellationToken);
        if (process.ExitCode != 0) throw new InvalidOperationException($"{fileName} failed: {error}");
    }
}
