using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Enums;
using Prestacontrol.Domain.Interfaces;
using System.Security.Claims;
using Prestacontrol.API.Services;
using Prestacontrol.Application.Common;

namespace Prestacontrol.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _audit;

    public UsersController(IUnitOfWork unitOfWork, IAuditService audit) { _unitOfWork = unitOfWork; _audit = audit; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _unitOfWork.Users.GetAllAsync();
        return Ok(users.OrderBy(u => u.FullName).Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateManagedUserRequest request)
    {
        var validation = Validate(request.FullName, request.Username, request.Password);
        if (validation != null) return BadRequest(new { message = validation });

        var username = request.Username.Trim();
        if (await _unitOfWork.Users.GetByUsernameAsync(username) != null)
            return Conflict(new { message = "Ese nombre de usuario ya está registrado." });

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Username = username,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Role = request.Role,
            IsActive = true
        };
        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.CompleteAsync();
        await _audit.RecordAsync(User, "Usuarios", "Creó usuario", "User", user.Id, $"Rol: {user.Role}");
        return Ok(ToDto(user));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserDto>> Update(int id, [FromBody] UpdateManagedUserRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        if (user == null) return NotFound(new { message = "Usuario no encontrado." });

        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentUserId && (!request.IsActive || request.Role != UserRole.Admin))
            return BadRequest(new { message = "No puedes desactivar ni quitarte el rol de administrador a ti mismo." });

        var validation = Validate(request.FullName, request.Username, request.Password, false);
        if (validation != null) return BadRequest(new { message = validation });

        var username = request.Username.Trim();
        var existing = await _unitOfWork.Users.GetByUsernameAsync(username);
        if (existing != null && existing.Id != id)
            return Conflict(new { message = "Ese nombre de usuario ya está registrado." });

        if (user.Role == UserRole.Admin && (!request.IsActive || request.Role != UserRole.Admin))
        {
            var activeAdmins = (await _unitOfWork.Users.FindAsync(u => u.Role == UserRole.Admin && u.IsActive && u.Id != id)).Any();
            if (!activeAdmins) return BadRequest(new { message = "Debe existir al menos un administrador activo." });
        }

        user.FullName = request.FullName.Trim();
        user.Username = username;
        user.Role = request.Role;
        user.IsActive = request.IsActive;
        if (!string.IsNullOrWhiteSpace(request.Password)) user.PasswordHash = PasswordHasher.Hash(request.Password);
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.CompleteAsync();
        await _audit.RecordAsync(User, "Usuarios", "Editó usuario", "User", user.Id, $"Rol: {user.Role}; Activo: {user.IsActive}");
        return Ok(ToDto(user));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        if (user == null) return NotFound(new { message = "Usuario no encontrado." });
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentUserId) return BadRequest(new { message = "No puedes desactivar tu propio usuario." });
        if (user.Role == UserRole.Admin && user.IsActive && !(await _unitOfWork.Users.FindAsync(u => u.Role == UserRole.Admin && u.IsActive && u.Id != id)).Any())
            return BadRequest(new { message = "Debe existir al menos un administrador activo." });

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.CompleteAsync();
        await _audit.RecordAsync(User, "Usuarios", "Desactivó usuario", "User", user.Id);
        return NoContent();
    }

    private static string? Validate(string fullName, string username, string? password, bool passwordRequired = true)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return "El nombre completo es obligatorio.";
        if (string.IsNullOrWhiteSpace(username)) return "El nombre de usuario es obligatorio.";
        if (username.Trim().Length < 3) return "El usuario debe tener al menos 3 caracteres.";
        if (passwordRequired && string.IsNullOrWhiteSpace(password)) return "La contraseña es obligatoria.";
        if (!string.IsNullOrWhiteSpace(password) && password.Length < 6) return "La contraseña debe tener al menos 6 caracteres.";
        return null;
    }

    private static UserDto ToDto(User user) => new()
    {
        Id = user.Id, FullName = user.FullName, Username = user.Username, Role = user.Role, IsActive = user.IsActive
    };
}
