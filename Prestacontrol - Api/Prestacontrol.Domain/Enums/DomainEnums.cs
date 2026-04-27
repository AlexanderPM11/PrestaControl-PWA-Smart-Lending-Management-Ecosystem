namespace Prestacontrol.Domain.Enums
{
    public enum UserRole
    {
        Admin,
        Cobrador
    }

    public enum ClientStatus
    {
        Active,
        Inactive,
        Blocked
    }

    public enum LoanFrequency
    {
        Diario,
        Semanal,
        Quincenal,
        Mensual
    }

    public enum LoanStatus
    {
        Pending,
        Active,
        Paid,
        Overdue,
        Defaulted,
        Cancelled
    }

    public enum InstallmentStatus
    {
        Pending,
        Partial,
        Paid,
        Overdue
    }

    public enum CashFlowType
    {
        Income,
        Outcome
    }
}
