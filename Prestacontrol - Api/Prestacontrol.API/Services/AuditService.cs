using Prestacontrol.Domain.Entities;
using Prestacontrol.Infrastructure.Persistence;
using System.Security.Claims;

namespace Prestacontrol.API.Services;

public interface IAuditService
{
    Task RecordAsync(ClaimsPrincipal principal, string module, string action, string? entityType = null, int? entityId = null, string? details = null);
}

public sealed class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    public AuditService(ApplicationDbContext context) => _context = context;

    public async Task RecordAsync(ClaimsPrincipal principal, string module, string action, string? entityType = null, int? entityId = null, string? details = null)
    {
        var userIdValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = int.TryParse(userIdValue, out var userId) ? userId : null,
            Username = principal.FindFirstValue(ClaimTypes.Name) ?? "sistema",
            Module = module,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            OccurredAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }
}
