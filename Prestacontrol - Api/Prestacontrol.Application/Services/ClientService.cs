using AutoMapper;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Enums;
using Prestacontrol.Domain.Interfaces;
using System.Text.RegularExpressions;

namespace Prestacontrol.Application.Services
{
    public class ClientService : IClientService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ClientService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ClientDto>> GetClientsAsync(string? search)
        {
            var clients = await _unitOfWork.Clients.GetAllAsync();
            var loans = await _unitOfWork.Loans.GetAllAsync();
            var query = clients.Where(c => c.IsActive);
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c => c.FullName.Contains(search, StringComparison.OrdinalIgnoreCase));

            return query.OrderBy(c => c.FullName).Select(c => ToDto(c, loans.Where(l => l.ClientId == c.Id))).ToList();
        }

        public async Task<ClientDto?> GetClientAsync(int id)
        {
            var client = await _unitOfWork.Clients.GetByIdAsync(id);
            if (client == null) return null;
            var loans = await _unitOfWork.Loans.FindAsync(l => l.ClientId == id);
            return ToDto(client, loans);
        }

        public async Task<ClientDto> CreateClientAsync(CreateClientRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                throw new ArgumentException("El nombre del cliente es obligatorio.");

            var existing = await _unitOfWork.Clients.FindAsync(c =>
                c.FullName.ToLower() == request.FullName.Trim().ToLower() && c.IsActive);
            if (existing.Any()) throw new InvalidOperationException("Ya existe un cliente con ese nombre.");

            var phone = NormalizeDominicanPhone(request.Phone);
            var client = new Client
            {
                FullName = request.FullName.Trim(),
                Phone = phone,
                DocumentId = request.DocumentId?.Trim(),
                Address = request.Address?.Trim(),
                Notes = request.Notes?.Trim()
            };
            await _unitOfWork.Clients.AddAsync(client);
            await _unitOfWork.CompleteAsync();
            return ToDto(client, Array.Empty<Loan>());
        }

        public async Task<ClientDto?> UpdateClientAsync(int id, UpdateClientRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                throw new ArgumentException("El nombre del cliente es obligatorio.");

            var client = await _unitOfWork.Clients.GetByIdAsync(id);
            if (client == null || !client.IsActive) return null;

            var duplicate = await _unitOfWork.Clients.FindAsync(c =>
                c.Id != id && c.IsActive && c.FullName.ToLower() == request.FullName.Trim().ToLower());
            if (duplicate.Any()) throw new InvalidOperationException("Ya existe otro cliente con ese nombre.");

            client.FullName = request.FullName.Trim();
            client.Phone = NormalizeDominicanPhone(request.Phone);
            client.DocumentId = request.DocumentId?.Trim();
            client.Address = request.Address?.Trim();
            client.Notes = request.Notes?.Trim();
            _unitOfWork.Clients.Update(client);
            await _unitOfWork.CompleteAsync();

            var loans = await _unitOfWork.Loans.FindAsync(l => l.ClientId == id);
            return ToDto(client, loans);
        }

        private ClientDto ToDto(Client client, IEnumerable<Loan> loans)
        {
            var list = loans.ToList();
            return new ClientDto
            {
                Id = client.Id, FullName = client.FullName, Phone = client.Phone,
                DocumentId = client.DocumentId, Address = client.Address, Notes = client.Notes,
                IsActive = client.IsActive, TotalLoans = list.Count,
                ActiveLoans = list.Count(l => l.Status == LoanStatus.Active || l.Status == LoanStatus.Overdue),
                BalanceDue = list.Sum(l => l.BalanceDue)
            };
        }

        private static string? NormalizeDominicanPhone(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return null;
            var digits = Regex.Replace(phone, @"\D", "");
            if (!Regex.IsMatch(digits, @"^(809|829|849)\d{7}$"))
                throw new ArgumentException("El teléfono debe tener formato dominicano válido: (809) 555-5555.");
            return $"{digits[..3]}-{digits[3..6]}-{digits[6..]}";
        }
    }
}
