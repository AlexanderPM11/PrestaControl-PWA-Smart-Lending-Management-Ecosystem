using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection;
using System.Net;
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
        var redirectUri = Get("BACKUP_GOOGLE_REDIRECT_URI", "https://prestacontrol.apolanco.com/api/backups/google/callback");
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(Get("BACKUP_GOOGLE_CLIENT_SECRET")))
            return BadRequest(new { message = "Google Drive no está configurado en el entorno." });

        var state = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        var stateConfig = await _context.SystemConfigs.FindAsync("Backups.GoogleOAuthState")
            ?? new Domain.Entities.SystemConfig { Key = "Backups.GoogleOAuthState" };
        stateConfig.Value = $"{state}|{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
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
        var parts = stored?.Value?.Split('|', 2);
        if (string.IsNullOrWhiteSpace(code) || parts?.Length != 2 || parts[0] != state || !long.TryParse(parts[1], out var issuedAt) || DateTimeOffset.UtcNow.ToUnixTimeSeconds() - issuedAt > 600)
            return Redirect(redirectBack + "invalid");

        using var response = await _httpClientFactory.CreateClient().PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = Get("BACKUP_GOOGLE_CLIENT_ID")!,
            ["client_secret"] = Get("BACKUP_GOOGLE_CLIENT_SECRET")!,
            ["redirect_uri"] = Get("BACKUP_GOOGLE_REDIRECT_URI", "https://prestacontrol.apolanco.com/api/backups/google/callback")!,
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
}

public sealed class BackupSettingsRequest
{
    public bool Enabled { get; set; }
}
