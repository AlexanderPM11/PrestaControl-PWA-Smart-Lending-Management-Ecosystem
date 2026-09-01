using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection;
using System.Net;
using System.Text;
using System.Diagnostics;
using System.Security.Cryptography;
using Prestacontrol.Infrastructure.Persistence;

namespace Prestacontrol.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/backups")]
public sealed class BackupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IDataProtector _protector;
    private readonly IHttpClientFactory _httpClientFactory;

    public BackupsController(ApplicationDbContext context, IConfiguration configuration, IDataProtectionProvider dataProtectionProvider, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _configuration = configuration;
        _protector = dataProtectionProvider.CreateProtector("PrestaControl.GoogleDrive.RefreshToken.v1");
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var setting = await _context.SystemConfigs.FindAsync("Backups.Enabled");
        var enabled = setting == null && bool.TryParse(Environment.GetEnvironmentVariable("BACKUP_ENABLED"), out var envEnabled)
            ? envEnabled
            : setting != null && bool.TryParse(setting.Value, out var savedEnabled) && savedEnabled;
        var token = await _context.SystemConfigs.FindAsync("Backups.GoogleRefreshToken");
        var hasToken = token != null || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("BACKUP_GOOGLE_REFRESH_TOKEN"));
        var googleConfigured = !string.IsNullOrWhiteSpace(Get("BACKUP_GOOGLE_CLIENT_ID"))
            && !string.IsNullOrWhiteSpace(Get("BACKUP_GOOGLE_CLIENT_SECRET"))
            && !string.IsNullOrWhiteSpace(Get("BACKUP_GOOGLE_DRIVE_FOLDER_ID"));
        return Ok(new { enabled, configured = googleConfigured && hasToken, googleConfigured, connected = googleConfigured && hasToken });
    }

    [HttpGet("google/connect")]
    public async Task<IActionResult> ConnectGoogle()
    {
        var clientId = Get("BACKUP_GOOGLE_CLIENT_ID");
        var origin = Request.Headers.Origin.FirstOrDefault();
        var isLocal = Uri.TryCreate(origin, UriKind.Absolute, out var originUri)
            && (originUri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) || originUri.Host.Equals("127.0.0.1"));
        var redirectUri = isLocal
            ? $"{originUri!.GetLeftPart(UriPartial.Authority)}/api/backups/google/callback"
            : Get("BACKUP_GOOGLE_REDIRECT_URI", "https://prestacontrol.apolanco.com/api/backups/google/callback");
        var returnUrl = isLocal ? $"{originUri!.GetLeftPart(UriPartial.Authority)}/profile" : "https://prestacontrol.apolanco.com/profile";
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(Get("BACKUP_GOOGLE_CLIENT_SECRET")))
            return BadRequest(new { message = "Google Drive no está configurado en el entorno." });

        var state = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        var stateConfig = await _context.SystemConfigs.FindAsync("Backups.GoogleOAuthState")
            ?? new Domain.Entities.SystemConfig { Key = "Backups.GoogleOAuthState" };
        stateConfig.Value = $"{state}|{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}|{Encode(redirectUri!)}|{Encode(returnUrl)}";
        stateConfig.UpdatedAt = DateTime.UtcNow;
        if (_context.Entry(stateConfig).State == EntityState.Detached) await _context.SystemConfigs.AddAsync(stateConfig);
        await _context.SaveChangesAsync();

        var query = new Dictionary<string, string>
        {
            ["client_id"] = clientId!,
            ["redirect_uri"] = redirectUri!,
            ["response_type"] = "code",
            ["scope"] = "https://www.googleapis.com/auth/drive",
            ["access_type"] = "offline",
            ["prompt"] = "consent",
            ["state"] = state
        };
        return Ok(new { url = "https://accounts.google.com/o/oauth2/v2/auth?" + string.Join("&", query.Select(x => $"{WebUtility.UrlEncode(x.Key)}={WebUtility.UrlEncode(x.Value)}")) });
    }

    [AllowAnonymous]
    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
    {
        var redirectBack = "/profile?backup=";
        if (!string.IsNullOrWhiteSpace(error)) return Redirect(redirectBack + "denied");
        var stored = await _context.SystemConfigs.FindAsync("Backups.GoogleOAuthState");
        var parts = stored?.Value?.Split('|', 4);
        if (string.IsNullOrWhiteSpace(code) || parts?.Length != 4 || parts[0] != state || !long.TryParse(parts[1], out var issuedAt) || DateTimeOffset.UtcNow.ToUnixTimeSeconds() - issuedAt > 600)
            return Redirect("https://prestacontrol.apolanco.com/profile?backup=invalid");
        var callbackUri = Decode(parts[2]);
        var returnUrl = Decode(parts[3]);
        if (string.IsNullOrWhiteSpace(callbackUri) || string.IsNullOrWhiteSpace(returnUrl)) return Redirect("https://prestacontrol.apolanco.com/profile?backup=invalid");
        redirectBack = $"{returnUrl}?backup=";

        using var response = await _httpClientFactory.CreateClient().PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = Get("BACKUP_GOOGLE_CLIENT_ID")!,
            ["client_secret"] = Get("BACKUP_GOOGLE_CLIENT_SECRET")!,
            ["redirect_uri"] = callbackUri,
            ["grant_type"] = "authorization_code"
        }));
        if (!response.IsSuccessStatusCode) return Redirect(redirectBack + "error");
        using var json = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if (!json.RootElement.TryGetProperty("refresh_token", out var refreshToken)) return Redirect(redirectBack + "missing-token");
        var tokenConfig = await _context.SystemConfigs.FindAsync("Backups.GoogleRefreshToken")
            ?? new Domain.Entities.SystemConfig { Key = "Backups.GoogleRefreshToken" };
        tokenConfig.Value = _protector.Protect(refreshToken.GetString()!);
        tokenConfig.UpdatedAt = DateTime.UtcNow;
        if (_context.Entry(tokenConfig).State == EntityState.Detached) await _context.SystemConfigs.AddAsync(tokenConfig);
        stored!.Value = string.Empty;
        await _context.SaveChangesAsync();
        return Redirect(redirectBack + "connected");
    }

    [HttpDelete("google/disconnect")]
    public async Task<IActionResult> DisconnectGoogle()
    {
        var token = await _context.SystemConfigs.FindAsync("Backups.GoogleRefreshToken");
        if (token != null) { _context.SystemConfigs.Remove(token); await _context.SaveChangesAsync(); }
        return Ok(new { connected = false });
    }

    [HttpPost("restore")]
    [RequestFormLimits(MultipartBodyLengthLimit = 1024L * 1024L * 1024L)]
    public async Task<IActionResult> Restore([FromForm] IFormFile? backup, CancellationToken cancellationToken)
    {
        if (backup == null || backup.Length == 0) return BadRequest(new { message = "Selecciona un archivo de backup." });
        if (backup.Length > 1024L * 1024L * 1024L || !backup.FileName.EndsWith(".pca", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "El archivo debe ser un backup .pca válido de PrestaControl." });

        var temp = Path.Combine(Path.GetTempPath(), "prestacontrol-restore", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(temp);
        var encrypted = Path.Combine(temp, "backup.pca");
        var archive = Path.Combine(temp, "backup.tar.gz");
        var dump = Path.Combine(temp, "database.sql");
        try
        {
            await using (var destination = System.IO.File.Create(encrypted)) await backup.CopyToAsync(destination, cancellationToken);
            await DecryptFile(encrypted, archive, Get("BACKUP_ENCRYPTION_PASSWORD") ?? string.Empty, cancellationToken);
            await ExtractDatabaseDump(archive, dump, cancellationToken);
            await ImportDatabase(dump, cancellationToken);
            return Ok(new { message = "La base de datos fue restaurada correctamente desde el backup." });
        }
        catch (CryptographicException) { return BadRequest(new { message = "No se pudo descifrar el backup. Verifica la contraseña configurada." }); }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"No se pudo restaurar el backup: {ex.Message}" });
        }
        finally
        {
            try { if (Directory.Exists(temp)) Directory.Delete(temp, true); } catch { }
        }
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] BackupSettingsRequest request)
    {
        var setting = await _context.SystemConfigs.FindAsync("Backups.Enabled");
        if (setting == null)
        {
            setting = new Domain.Entities.SystemConfig { Key = "Backups.Enabled" };
            await _context.SystemConfigs.AddAsync(setting);
        }
        setting.Value = request.Enabled ? "true" : "false";
        setting.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { enabled = request.Enabled });
    }

    private string? Get(string key, string? fallback = null) => Environment.GetEnvironmentVariable(key) ?? _configuration[key] ?? fallback;
    private static string Encode(string value) => Convert.ToBase64String(Encoding.UTF8.GetBytes(value)).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private static string Decode(string value)
    {
        try { return Encoding.UTF8.GetString(Convert.FromBase64String(value.Replace('-', '+').Replace('_', '/') + new string('=', (4 - value.Length % 4) % 4))); }
        catch { return string.Empty; }
    }

    private async Task DecryptFile(string input, string output, string password, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(password)) throw new InvalidOperationException("BACKUP_ENCRYPTION_PASSWORD no está configurada.");
        await using var source = System.IO.File.OpenRead(input);
        var magic = new byte[4]; await source.ReadExactlyAsync(magic, cancellationToken);
        if (Encoding.ASCII.GetString(magic) != "PCA1") throw new CryptographicException("Formato de backup no reconocido.");
        var salt = new byte[32]; var iv = new byte[16]; await source.ReadExactlyAsync(salt, cancellationToken); await source.ReadExactlyAsync(iv, cancellationToken);
        using var key = new Rfc2898DeriveBytes(password, salt, 600_000, HashAlgorithmName.SHA256);
        using var aes = Aes.Create(); aes.Key = key.GetBytes(32); aes.IV = iv; aes.Mode = CipherMode.CBC; aes.Padding = PaddingMode.PKCS7;
        await using var crypto = new CryptoStream(source, aes.CreateDecryptor(), CryptoStreamMode.Read);
        await using var destination = System.IO.File.Create(output); await crypto.CopyToAsync(destination, cancellationToken);
    }

    private static async Task ExtractDatabaseDump(string archive, string dump, CancellationToken cancellationToken)
    {
        var process = Process.Start(new ProcessStartInfo("tar", $"-xOzf {Quote(archive)} database.sql") { RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false, CreateNoWindow = true }) ?? throw new InvalidOperationException("No se pudo abrir el archivo de backup.");
        await using (var output = System.IO.File.Create(dump)) await process.StandardOutput.BaseStream.CopyToAsync(output, cancellationToken);
        var error = await process.StandardError.ReadToEndAsync(cancellationToken); await process.WaitForExitAsync(cancellationToken);
        if (process.ExitCode != 0) throw new InvalidOperationException($"El backup no contiene un volcado válido: {error}");
    }

    private async Task ImportDatabase(string dump, CancellationToken cancellationToken)
    {
        var host = Get("BACKUP_DB_HOST", "db") ?? "db";
        var port = Get("BACKUP_DB_PORT", "3306") ?? "3306";
        var user = Get("BACKUP_DB_USER", "root") ?? "root";
        var database = Get("BACKUP_DB_NAME") ?? throw new InvalidOperationException("BACKUP_DB_NAME no está configurada.");
        var psi = new ProcessStartInfo("mysql", $"-h {Quote(host)} -P {port} -u {Quote(user)} {Quote(database)}")
        { RedirectStandardError = true, RedirectStandardInput = true, UseShellExecute = false, CreateNoWindow = true };
        psi.Environment["MYSQL_PWD"] = Get("BACKUP_DB_PASSWORD", Get("MYSQL_ROOT_PASSWORD")) ?? string.Empty;
        using var process = Process.Start(psi) ?? throw new InvalidOperationException("No se pudo iniciar la restauración de MySQL.");
        await using (var input = System.IO.File.OpenRead(dump)) await input.CopyToAsync(process.StandardInput.BaseStream, cancellationToken);
        await process.StandardInput.BaseStream.FlushAsync(cancellationToken); process.StandardInput.Close();
        var error = await process.StandardError.ReadToEndAsync(cancellationToken); await process.WaitForExitAsync(cancellationToken);
        if (process.ExitCode != 0) throw new InvalidOperationException($"MySQL rechazó la restauración: {error}");
    }

    private static string Quote(string value) => $"\"{value.Replace("\"", "\\\"")}\"";
}

public sealed class BackupSettingsRequest
{
    public bool Enabled { get; set; }
}
