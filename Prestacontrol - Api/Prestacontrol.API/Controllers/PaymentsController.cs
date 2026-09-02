using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using System.Security.Claims;
using Prestacontrol.API.Services;
using Prestacontrol.Infrastructure.Persistence;

namespace Prestacontrol.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IAuditService _audit;
        private readonly ApplicationDbContext _context;

        public PaymentsController(IPaymentService paymentService, IAuditService audit, ApplicationDbContext context)
        {
            _paymentService = paymentService; _audit = audit; _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Process([FromBody] PaymentRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _paymentService.ProcessPaymentAsync(request, userId);
                await _audit.RecordAsync(User, "Pagos", "Registró pago", "Loan", request.LoanId, $"Capital: {request.CapitalAmount}; Interés: {request.InterestAmount}; Método: {request.PaymentMethod}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var result = await _paymentService.GetPendingLoansAsync();
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditPayment(int id, [FromBody] EditPaymentRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var previous = await _context.Payments.FindAsync(id);
                var result = await _paymentService.EditPaymentAsync(id, request, userId);
                if (!result) return NotFound(new { message = "Pago no encontrado" });
                await _audit.RecordAsync(User, "Pagos", "Editó pago", "Payment", id, $"Antes: Total={previous?.Amount}; Observación={previous?.Notes}. Después: Capital={request.CapitalAmount}; Interés={request.InterestAmount}; Total={request.CapitalAmount + request.InterestAmount}; Observación={request.Notes}");
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
