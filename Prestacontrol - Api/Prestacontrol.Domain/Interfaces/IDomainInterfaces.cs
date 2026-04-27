using System.Linq.Expressions;

namespace Prestacontrol.Domain.Interfaces
{
    public interface IGenericRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(int id);
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task AddAsync(T entity);
        void Update(T entity);
        void Delete(T entity);
    }

    public interface IUserRepository : IGenericRepository<Entities.User> 
    {
        Task<Entities.User?> GetByUsernameAsync(string username);
    }


    public interface ILoanRepository : IGenericRepository<Entities.Loan> { }
    public interface IInstallmentRepository : IGenericRepository<Entities.Installment> { }
    public interface IPaymentRepository : IGenericRepository<Entities.Payment> { }
    public interface ICashFlowRepository : IGenericRepository<Entities.CashFlow> { }
    public interface IFinancialTransactionRepository : IGenericRepository<Entities.FinancialTransaction> { }
    public interface ILoanAuditLogRepository : IGenericRepository<Entities.LoanAuditLog> { }

    public interface IUnitOfWork : IDisposable
    {
        IUserRepository Users { get; }

        ILoanRepository Loans { get; }
        IInstallmentRepository Installments { get; }
        IPaymentRepository Payments { get; }
        ICashFlowRepository CashFlows { get; }
        IFinancialTransactionRepository FinancialTransactions { get; }
        ILoanAuditLogRepository LoanAuditLogs { get; }
        Task<int> CompleteAsync();
    }
}
