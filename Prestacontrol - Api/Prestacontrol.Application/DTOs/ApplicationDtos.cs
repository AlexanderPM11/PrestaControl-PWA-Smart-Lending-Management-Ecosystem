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

    public class LoginRequest { public string Username { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
    public class LoginResponse { public string Token { get; set; } = string.Empty; public UserDto User { get; set; } = null!; }


    public class LoanDto
    {
        public int Id { get; set; }

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
        public string ClientName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal InterestRate { get; set; }
        public decimal LateFeeRate { get; set; }
        public LoanFrequency Frequency { get; set; }
        public int InstallmentsCount { get; set; }
        public DateTime StartDate { get; set; }
    }

    public class PaymentRequest
    {
        public int LoanId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Efectivo";
        public string? Notes { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.Now;
    }

    public class PaymentDto
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public int? InstallmentId { get; set; }
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
