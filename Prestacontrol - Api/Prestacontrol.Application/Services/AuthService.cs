using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using AutoMapper;
using Prestacontrol.Application.Common;

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
                expires: Prestacontrol.Application.Common.DRTimeProvider.Now.AddDays(7),
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
            if (user == null || !user.IsActive || !PasswordHasher.Verify(request.Password, user.PasswordHash, out var needsMigration))
                return null;

            if (needsMigration)
            {
                user.PasswordHash = PasswordHasher.Hash(request.Password);
                _unitOfWork.Users.Update(user);
                await _unitOfWork.CompleteAsync();
            }

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
                PasswordHash = PasswordHasher.Hash(password),
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

            // Generate a random 6-digit PIN
            var newPassword = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            
            user.PasswordHash = PasswordHasher.Hash(newPassword);
            _unitOfWork.Users.Update(user);
            await _unitOfWork.CompleteAsync();

            var message = $"<b>🔑 Recuperación de Contraseña</b>\n\n" +
                          $"Hola <b>{user.FullName}</b>,\n" +
                          $"Has solicitado recuperar tu contraseña en <b>Prestacontrol</b>.\n\n" +
                          $"Tu nueva contraseña temporal es: <code>{newPassword}</code>\n\n" +
                          $"<i>Por seguridad, te recomendamos iniciar sesión e ir a la sección de 'Perfil' para cambiarla inmediatamente.</i>";

            await _telegramService.SendMessageAsync(message);
            return true;
        }

        public async Task<bool> UpdateProfileAsync(int userId, UpdateProfileRequest request)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null) return false;

            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                user.FullName = request.FullName.Trim();
                _unitOfWork.Users.Update(user);
                await _unitOfWork.CompleteAsync();
                return true;
            }
            return false;
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null) return false;

            if (!PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash, out _))
                throw new Exception("La contraseña actual es incorrecta.");

            user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
            _unitOfWork.Users.Update(user);
            await _unitOfWork.CompleteAsync();
            return true;
        }
    }
}
