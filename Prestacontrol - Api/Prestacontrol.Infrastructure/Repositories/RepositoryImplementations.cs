using Microsoft.EntityFrameworkCore;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Interfaces;
using System.Linq.Expressions;

namespace Prestacontrol.Infrastructure.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        protected readonly Persistence.ApplicationDbContext _context;
        public GenericRepository(Persistence.ApplicationDbContext context) => _context = context;

        public async Task<T?> GetByIdAsync(int id) => await _context.Set<T>().FindAsync(id);
        public async Task<IEnumerable<T>> GetAllAsync() => await _context.Set<T>().ToListAsync();
        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate) => await _context.Set<T>().Where(predicate).ToListAsync();
        public async Task AddAsync(T entity) => await _context.Set<T>().AddAsync(entity);
        public void Update(T entity) => _context.Set<T>().Update(entity);
        public void Delete(T entity) => _context.Set<T>().Remove(entity);
    }

    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(Persistence.ApplicationDbContext context) : base(context) { }
        public async Task<User?> GetByUsernameAsync(string username) => 
            await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
    }


    public class LoanRepository : GenericRepository<Loan>, ILoanRepository 
    { 
        public LoanRepository(Persistence.ApplicationDbContext context) : base(context) { } 

        public new async Task<Loan?> GetByIdAsync(int id)
        {
            return await _context.Loans
                .Include(l => l.Installments)
                .FirstOrDefaultAsync(l => l.Id == id);
        }
    }
    public class InstallmentRepository : GenericRepository<Installment>, IInstallmentRepository { public InstallmentRepository(Persistence.ApplicationDbContext context) : base(context) { } }
    public class PaymentRepository : GenericRepository<Payment>, IPaymentRepository { public PaymentRepository(Persistence.ApplicationDbContext context) : base(context) { } }
    public class CashFlowRepository : GenericRepository<CashFlow>, ICashFlowRepository { public CashFlowRepository(Persistence.ApplicationDbContext context) : base(context) { } }
    public class FinancialTransactionRepository : GenericRepository<FinancialTransaction>, IFinancialTransactionRepository { public FinancialTransactionRepository(Persistence.ApplicationDbContext context) : base(context) { } }
    public class LoanAuditLogRepository : GenericRepository<LoanAuditLog>, ILoanAuditLogRepository { public LoanAuditLogRepository(Persistence.ApplicationDbContext context) : base(context) { } }

    public class UnitOfWork : IUnitOfWork
    {
        private readonly Persistence.ApplicationDbContext _context;
        public UnitOfWork(Persistence.ApplicationDbContext context)
        {
            _context = context;
            Users = new UserRepository(_context);

            Loans = new LoanRepository(_context);
            Installments = new InstallmentRepository(_context);
            Payments = new PaymentRepository(_context);
            CashFlows = new CashFlowRepository(_context);
            FinancialTransactions = new FinancialTransactionRepository(_context);
            LoanAuditLogs = new LoanAuditLogRepository(_context);
        }

        public IUserRepository Users { get; private set; }

        public ILoanRepository Loans { get; private set; }
        public IInstallmentRepository Installments { get; private set; }
        public IPaymentRepository Payments { get; private set; }
        public ICashFlowRepository CashFlows { get; private set; }
        public IFinancialTransactionRepository FinancialTransactions { get; private set; }
        public ILoanAuditLogRepository LoanAuditLogs { get; private set; }

        public async Task<int> CompleteAsync() => await _context.SaveChangesAsync();
        public void Dispose() => _context.Dispose();
    }
}
