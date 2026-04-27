using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using System.Security.Claims;

namespace Prestacontrol.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LoansController : ControllerBase
    {
        private readonly ILoanService _loanService;
        public LoansController(ILoanService loanService) => _loanService = loanService;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLoanRequest request)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _loanService.CreateLoanAsync(request, userId);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _loanService.GetClientLoansAsync(""); // Empty string means all
            return Ok(result);
        }

        [HttpGet("client/{clientName}")]
        public async Task<IActionResult> GetByClient(string clientName)
        {
            var result = await _loanService.GetClientLoansAsync(clientName);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetails(int id)
        {
            var result = await _loanService.GetLoanDetailsAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var success = await _loanService.CancelLoanAsync(id);
            if (!success) return BadRequest(new { message = "No se pudo anular el préstamo (quizás ya está pagado o no existe)." });
            return Ok(new { message = "Préstamo anulado con éxito." });
        }

        [HttpPut("{id}/reactivate")]
        public async Task<IActionResult> Reactivate(int id)
        {
            var success = await _loanService.ReactivateLoanAsync(id);
            if (!success) return BadRequest(new { message = "No se pudo reactivar el préstamo." });
            return Ok(new { message = "Préstamo reactivado con éxito." });
        }

        [HttpGet("{id}/payments")]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetPayments(int id)
        {
            var payments = await _loanService.GetLoanPaymentsAsync(id);
            return Ok(payments);
        }

        [HttpGet("{id}/audits")]
        public async Task<ActionResult<IEnumerable<LoanAuditLogDto>>> GetAudits(int id)
        {
            var audits = await _loanService.GetLoanAuditsAsync(id);
            return Ok(audits);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLoan(int id, [FromBody] UpdateLoanRequest request)
        {
            var success = await _loanService.UpdateLoanAsync(id, request);
            if (!success) return BadRequest(new { message = "No se pudo actualizar el préstamo (no existe o error interno)." });
            return Ok(new { message = "Préstamo actualizado con éxito." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _loanService.DeleteLoanAsync(id);
            if (!success) return NotFound(new { message = "Préstamo no encontrado." });
            return Ok(new { message = "Préstamo eliminado de la base de datos." });
        }
    }
}
