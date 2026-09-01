using Prestacontrol.Domain.Enums;

namespace Prestacontrol.Application.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateManagedUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Cobrador;
    }

    public class UpdateManagedUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? Password { get; set; }
        public UserRole Role { get; set; } = UserRole.Cobrador;
        public bool IsActive { get; set; } = true;
    }

    public class LoginRequest { public string Username { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
    public class LoginResponse { public string Token { get; set; } = string.Empty; public UserDto User { get; set; } = null!; }

    public class UpdateProfileRequest { public string FullName { get; set; } = string.Empty; }
    public class ChangePasswordRequest { public string CurrentPassword { get; set; } = string.Empty; public string NewPassword { get; set; } = string.Empty; }


    public class LoanDto
    {
        public int Id { get; set; }
        public int? ClientId { get; set; }

        public string ClientName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal InterestRate { get; set; }
        public decimal LateFeeRate { get; set; }
        public LoanFrequency Frequency { get; set; }
        public int InstallmentsCount { get; set; }
        public decimal TotalToPay { get; set; }
        public decimal BalanceDue { get; set; }
        public LoanStatus Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<InstallmentDto> Installments { get; set; } = new();
    }

    public class InstallmentDto
    {
        public int Id { get; set; }
        public int InstallmentNumber { get; set; }
        public DateTime DueDate { get; set; }
        public decimal Amount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal ArrearsAmount { get; set; }
        public InstallmentStatus Status { get; set; }
    }

    public class CreateLoanRequest
    {
        public int? ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal InterestRate { get; set; }
        public decimal LateFeeRate { get; set; }
        public LoanFrequency Frequency { get; set; }
        public int InstallmentsCount { get; set; }
        public DateTime StartDate { get; set; }
    }

    public class ClientDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? DocumentId { get; set; }
        public string? Address { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public int TotalLoans { get; set; }
        public int ActiveLoans { get; set; }
        public decimal BalanceDue { get; set; }
    }

    public class CreateClientRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? DocumentId { get; set; }
        public string? Address { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateClientRequest : CreateClientRequest { }

    public class PaymentRequest
    {
        public int LoanId { get; set; }
        public decimal CapitalAmount { get; set; }
        public decimal InterestAmount { get; set; }
        public decimal Amount => CapitalAmount + InterestAmount;
        public string PaymentMethod { get; set; } = "Efectivo";
        public string? Notes { get; set; }
        public DateTime PaymentDate { get; set; } = Prestacontrol.Application.Common.DRTimeProvider.Now;
    }

    public class PaymentDto
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        public decimal Amount { get; set; }
        public decimal CapitalAmount { get; set; }
        public decimal InterestAmount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public int? InstallmentId { get; set; }
    }

    public class EditPaymentRequest
    {
        public decimal CapitalAmount { get; set; }
        public decimal InterestAmount { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateLoanRequest
    {
        public string ClientName { get; set; } = string.Empty;
        // Only applied if no payments have been made
        public decimal Amount { get; set; }
        public decimal InterestRate { get; set; }
        public decimal LateFeeRate { get; set; }
        public LoanFrequency Frequency { get; set; }
        public int InstallmentsCount { get; set; }
        public DateTime StartDate { get; set; }
    }

    public class TransactionDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }

    public class LoanAuditLogDto
    {
        public int Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string ChangesDescription { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }
}
