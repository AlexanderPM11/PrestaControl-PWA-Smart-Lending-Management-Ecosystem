using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;

namespace Prestacontrol.Application.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _config;
        public JwtService(IConfiguration config) => _config = config;

        public string GenerateToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "SUPER_SECRET_KEY_PRESTACONTROL_2026_ARCHITECTURE"));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var token = new JwtSecurityToken(
                _config["Jwt:Issuer"],
                _config["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly IMapper _mapper;
        private readonly ITelegramService _telegramService;

        public AuthService(IUnitOfWork unitOfWork, IJwtService jwtService, IMapper mapper, ITelegramService telegramService)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _mapper = mapper;
            _telegramService = telegramService;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _unitOfWork.Users.GetByUsernameAsync(request.Username);
            if (user == null || user.PasswordHash != request.Password) // Simple check for demo, should be hashed
                return null;

            return new LoginResponse
            {
                Token = _jwtService.GenerateToken(user),
                User = _mapper.Map<UserDto>(user)
            };
        }

        public async Task<UserDto> RegisterAsync(UserDto userDto, string password)
        {
            var user = new User
            {
                FullName = userDto.FullName,
                Username = userDto.Username,
                PasswordHash = password, // Should be hashed
                Role = userDto.Role,
                IsActive = true
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> ForgotPasswordAsync(string username)
        {
            var user = await _unitOfWork.Users.GetByUsernameAsync(username);
            if (user == null) return false;

            var message = $"<b>🔑 Recuperación de Contraseña</b>\n\n" +
                          $"Hola <b>{user.FullName}</b>,\n" +
                          $"Has solicitado recuperar tu contraseña en <b>Prestacontrol</b>.\n\n" +
                          $"Tu contraseña es: <code>{user.PasswordHash}</code>\n\n" +
                          $"<i>Por seguridad, te recomendamos cambiarla desde el panel de configuración.</i>";

            await _telegramService.SendMessageAsync(message);
            return true;
        }
    }
}
