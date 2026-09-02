using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using Prestacontrol.API.Services;
using Prestacontrol.Infrastructure.Persistence;

namespace Prestacontrol.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly IAuditService _audit;
        private readonly ApplicationDbContext _context;
        public ClientsController(IClientService clientService, IAuditService audit, ApplicationDbContext context) { _clientService = clientService; _audit = audit; _context = context; }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search) => Ok(await _clientService.GetClientsAsync(search));

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var client = await _clientService.GetClientAsync(id);
            return client == null ? NotFound() : Ok(client);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClientRequest request)
        {
            try { var client = await _clientService.CreateClientAsync(request); await _audit.RecordAsync(User, "Clientes", "Registró cliente", "Client", client.Id, client.FullName); return Ok(client); }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClientRequest request)
        {
            try
            {
                var previous = await _context.Clients.FindAsync(id);
                var client = await _clientService.UpdateClientAsync(id, request);
                if (client != null) await _audit.RecordAsync(User, "Clientes", "Editó cliente", "Client", id, $"Antes: Nombre={previous?.FullName}; Teléfono={previous?.Phone}; Documento={previous?.DocumentId}. Después: Nombre={client.FullName}; Teléfono={client.Phone}; Documento={client.DocumentId}");
                return client == null ? NotFound() : Ok(client);
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }
    }
}
