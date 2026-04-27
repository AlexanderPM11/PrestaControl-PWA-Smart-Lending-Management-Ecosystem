using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Prestacontrol.Domain.Enums;
using Prestacontrol.Infrastructure.Persistence;

namespace Prestacontrol.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var totalLoaned = await _context.Loans
                .Where(l => l.Status != LoanStatus.Pending && l.Status != LoanStatus.Cancelled)
                .SumAsync(l => l.Amount);

            var totalCollected = await _context.FinancialTransactions
                .Where(t => t.Type == "Payment")
                .SumAsync(t => t.Amount);

            var activeClients = await _context.Loans
                .Where(l => l.Status == LoanStatus.Active)
                .Select(l => l.ClientName)
                .Distinct()
                .CountAsync();

            var pendingInstallments = await _context.Installments
                .Where(i => i.Status != InstallmentStatus.Paid && i.DueDate.Date == DateTime.Today)
                .Select(i => new {
                    i.Id,
                    ClientName = i.Loan.ClientName,
                    i.Amount,
                    i.LateFeeAmount,
                    i.Status
                })
                .ToListAsync();

            return Ok(new
            {
                TotalLoaned = totalLoaned,
                TotalCollected = totalCollected,
                ActiveClients = activeClients,
                TodayAgenda = pendingInstallments
            });
        }
    }
}
