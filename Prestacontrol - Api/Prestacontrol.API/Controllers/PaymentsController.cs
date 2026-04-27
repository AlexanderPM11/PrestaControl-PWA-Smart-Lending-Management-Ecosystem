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
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost]
        public async Task<IActionResult> Process([FromBody] PaymentRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _paymentService.ProcessPaymentAsync(request, userId);
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
    }
}
