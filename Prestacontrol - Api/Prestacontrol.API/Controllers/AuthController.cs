using Microsoft.AspNetCore.Mvc;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;

namespace Prestacontrol.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authService) => _authService = authService;

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null) 
            {
                Console.WriteLine("DEBUG: LoginRequest is NULL");
                return BadRequest(new { message = "Cuerpo de petición nulo" });
            }
            
            Console.WriteLine($"DEBUG: Login attempt for user: {request.Username}");

            if (!ModelState.IsValid)
            {
                var errors = string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                Console.WriteLine($"DEBUG: ModelState Invalid: {errors}");
                return BadRequest(new { message = "Error de validación", errors });
            }

            var response = await _authService.LoginAsync(request);
            if (response == null) return Unauthorized(new { message = "Credenciales inválidas" });
            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserDto userDto, [FromQuery] string password)
        {
            var result = await _authService.RegisterAsync(userDto, password);
            return Ok(result);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var result = await _authService.ForgotPasswordAsync(request.Username);
            if (!result) return NotFound(new { message = "Usuario no encontrado" });
            return Ok(new { message = "Enlace de recuperación enviado a Telegram" });
        }
    }

    public class ForgotPasswordRequest
    {
        public string Username { get; set; } = string.Empty;
    }
}
