using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Prestacontrol.API.Services;
using Prestacontrol.Infrastructure.Persistence;

namespace Prestacontrol.API.Controllers;

[ApiController]
[Route("api/audit")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _audit;
    private readonly ApplicationDbContext _context;
    public AuditController(IAuditService audit, ApplicationDbContext context) { _audit = audit; _context = context; }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public IActionResult Get([FromQuery] int limit = 100)
    {
        limit = Math.Clamp(limit, 1, 500);
        return Ok(_context.AuditLogs.OrderByDescending(x => x.OccurredAt).Take(limit).ToList());
    }

    [Authorize]
    [HttpPost("pdf")]
    public async Task<IActionResult> Pdf([FromBody] PdfAuditRequest request)
    {
        await _audit.RecordAsync(User, "Préstamos", "Generó PDF del préstamo", "Loan", request.LoanId, "Documento preparado para compartir.");
        return NoContent();
    }
}

public sealed class PdfAuditRequest { public int LoanId { get; set; } }
