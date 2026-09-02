using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using System.Security.Claims;
using Prestacontrol.API.Services;

namespace Prestacontrol.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly LoginRateLimiter _rateLimiter;
        public AuthController(IAuthService authService, LoginRateLimiter rateLimiter)
        {
            _authService = authService;
            _rateLimiter = rateLimiter;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null) 
            {
                Console.WriteLine("DEBUG: LoginRequest is NULL");
                return BadRequest(new { message = "Cuerpo de petición nulo" });
            }
            
            var username = request.Username.Trim();
            var clientKey = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var rateLimitKey = $"{clientKey}:{username.ToUpperInvariant()}";
            if (_rateLimiter.IsBlocked(rateLimitKey, out var retryAfter))
            {
                Response.Headers.RetryAfter = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
                return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Demasiados intentos fallidos. Espera unos minutos e inténtalo nuevamente." });
            }

            if (!ModelState.IsValid)
            {
                var errors = string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                Console.WriteLine($"DEBUG: ModelState Invalid: {errors}");
                return BadRequest(new { message = "Error de validación", errors });
            }

            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                _rateLimiter.RecordFailure(rateLimitKey);
                return Unauthorized(new { message = "Credenciales inválidas" });
            }
            _rateLimiter.Reset(rateLimitKey);
            return Ok(response);
        }

        [Authorize(Roles = "Admin")]
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

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var result = await _authService.UpdateProfileAsync(userId, request);
            if (!result) return BadRequest(new { message = "No se pudo actualizar el perfil" });
            return Ok(new { success = true, message = "Perfil actualizado correctamente" });
        }

        [Authorize]
        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            try
            {
                var result = await _authService.ChangePasswordAsync(userId, request);
                if (!result) return BadRequest(new { message = "No se pudo cambiar la contraseña" });
                return Ok(new { success = true, message = "Contraseña actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class ForgotPasswordRequest
    {
        public string Username { get; set; } = string.Empty;
    }
}
