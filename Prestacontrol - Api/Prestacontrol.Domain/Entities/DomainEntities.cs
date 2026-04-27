using Prestacontrol.Domain.Enums;

namespace Prestacontrol.Domain.Entities
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    public class User : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Cobrador;
        public bool IsActive { get; set; } = true;

        public ICollection<Loan> CreatedLoans { get; set; } = new List<Loan>();
        public ICollection<Payment> CollectedPayments { get; set; } = new List<Payment>();
        public ICollection<CashFlow> RegisteredCashFlows { get; set; } = new List<CashFlow>();
    }



    public class Loan : BaseEntity
    {
        public string ClientName { get; set; } = string.Empty;
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public decimal Amount { get; set; }
        public decimal InterestRate { get; set; }
        public decimal LateFeeRate { get; set; } // Daily or percentage
        public LoanFrequency Frequency { get; set; }
        public int InstallmentsCount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalToPay { get; set; }
        public decimal BalanceDue { get; set; }
        public LoanStatus Status { get; set; } = LoanStatus.Active;

        public ICollection<Installment> Installments { get; set; } = new List<Installment>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public class Installment : BaseEntity
    {
        public int LoanId { get; set; }
        public Loan Loan { get; set; } = null!;
        public int InstallmentNumber { get; set; }
        public DateTime DueDate { get; set; }
        public decimal Amount { get; set; }
        public decimal PrincipalAmount { get; set; }
        public decimal InterestAmount { get; set; }
        public decimal LateFeeAmount { get; set; } = 0;
        public decimal PaidAmount { get; set; } = 0;
        public decimal ArrearsAmount { get; set; } = 0;
        public InstallmentStatus Status { get; set; } = InstallmentStatus.Pending;
        public DateTime? PaidAt { get; set; }

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public class Payment : BaseEntity
    {
        public int LoanId { get; set; }
        public Loan Loan { get; set; } = null!;
        public int? InstallmentId { get; set; }
        public Installment? Installment { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.Now;
        public string PaymentMethod { get; set; } = "Efectivo";
        public string? Notes { get; set; }
    }

    public class CashFlow : BaseEntity
    {
        public decimal Amount { get; set; }
        public CashFlowType Type { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime Date { get; set; } = DateTime.Now;
    }

    public class FinancialTransaction : BaseEntity
    {
        public int? LoanId { get; set; }
        public Loan? Loan { get; set; }
        public int? PaymentId { get; set; }
        public Payment? Payment { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public decimal Amount { get; set; }
        public string Type { get; set; } = string.Empty; // Capital, Interest, LateFee
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.Now;
    }

    public class SystemConfig
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }

    public class LoanAuditLog : BaseEntity
    {
        public int LoanId { get; set; }
        public Loan Loan { get; set; } = null!;
        public string Action { get; set; } = string.Empty; // e.g., "Edited", "Cancelled", "Reactivated"
        public string ChangesDescription { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.Now;
    }
}
