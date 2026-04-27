using Prestacontrol.Application.DTOs;

namespace Prestacontrol.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse?> LoginAsync(LoginRequest request);
        Task<UserDto> RegisterAsync(UserDto userDto, string password);
        Task<bool> ForgotPasswordAsync(string username);
    }

    public interface ILoanService
    {
        Task<LoanDto> CreateLoanAsync(CreateLoanRequest request, int userId);
        Task<IEnumerable<LoanDto>> GetClientLoansAsync(string clientName);
        Task<LoanDto?> GetLoanDetailsAsync(int loanId);
        Task<IEnumerable<PaymentDto>> GetLoanPaymentsAsync(int loanId);
        Task<IEnumerable<LoanAuditLogDto>> GetLoanAuditsAsync(int loanId);
        Task<bool> CancelLoanAsync(int loanId);
        Task<bool> ReactivateLoanAsync(int loanId);
        Task<bool> UpdateLoanAsync(int loanId, UpdateLoanRequest request);
        Task<bool> DeleteLoanAsync(int loanId);
    }

    public interface IJwtService
    {
        string GenerateToken(Domain.Entities.User user);
    }

    public interface ITelegramService
    {
        Task SendMessageAsync(string message, string? chatId = null);
    }

    public interface IPaymentService
    {
        Task<IEnumerable<TransactionDto>> ProcessPaymentAsync(PaymentRequest request, int userId);
        Task<IEnumerable<LoanDto>> GetPendingLoansAsync();
    }

    public interface IDelinquencyService
    {
        Task<int> UpdateDelinquencyStatusAsync();
        Task<IEnumerable<LoanDto>> GetDelinquentLoansAsync();
    }
}
