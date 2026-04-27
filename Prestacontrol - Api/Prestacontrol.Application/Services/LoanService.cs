using AutoMapper;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Enums;
using Prestacontrol.Domain.Interfaces;

namespace Prestacontrol.Application.Services
{
    public class LoanService : ILoanService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public LoanService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<LoanDto> CreateLoanAsync(CreateLoanRequest request, int userId)
        {
            decimal totalInterest = request.Amount * (request.InterestRate / 100);
            decimal totalToPay = request.Amount + totalInterest;
            decimal installmentAmount = totalToPay / request.InstallmentsCount;
            decimal principalPerInstallment = request.Amount / request.InstallmentsCount;
            decimal interestPerInstallment = totalInterest / request.InstallmentsCount;

            var loan = new Loan
            {
                ClientName = request.ClientName,
                UserId = userId,
                Amount = request.Amount,
                InterestRate = request.InterestRate,
                LateFeeRate = request.LateFeeRate,
                Frequency = request.Frequency,
                InstallmentsCount = request.InstallmentsCount,
                StartDate = request.StartDate,
                TotalToPay = totalToPay,
                BalanceDue = totalToPay,
                Status = LoanStatus.Active,
                EndDate = CalculateEndDate(request.StartDate, request.Frequency, request.InstallmentsCount)
            };

            // Generate Installments
            for (int i = 1; i <= request.InstallmentsCount; i++)
            {
                loan.Installments.Add(new Installment
                {
                    InstallmentNumber = i,
                    DueDate = CalculateDueDate(request.StartDate, request.Frequency, i),
                    Amount = installmentAmount,
                    PrincipalAmount = principalPerInstallment,
                    InterestAmount = interestPerInstallment,
                    Status = InstallmentStatus.Pending
                });
            }

            await _unitOfWork.Loans.AddAsync(loan);
            
            // Record Disbursement in CashFlow
            await _unitOfWork.CashFlows.AddAsync(new CashFlow
            {
                Amount = request.Amount,
                Type = CashFlowType.Outcome,
                Category = "Préstamo",
                Description = $"Desembolso préstamo a cliente: {request.ClientName}",
                UserId = userId,
                Date = DateTime.Now
            });

            await _unitOfWork.CompleteAsync();

            return _mapper.Map<LoanDto>(loan);
        }

        public async Task<IEnumerable<LoanDto>> GetClientLoansAsync(string clientName)
        {
            var loans = await _unitOfWork.Loans.FindAsync(l => l.ClientName.Contains(clientName));
            return _mapper.Map<IEnumerable<LoanDto>>(loans);
        }

        public async Task<LoanDto?> GetLoanDetailsAsync(int loanId)
        {
            var loan = await _unitOfWork.Loans.GetByIdAsync(loanId);
            return _mapper.Map<LoanDto>(loan);
        }

        public async Task<bool> CancelLoanAsync(int loanId)
        {
            var loan = await _unitOfWork.Loans.GetByIdAsync(loanId);
            if (loan == null) return false;

            if (loan.Status == LoanStatus.Paid) return false;

            loan.Status = LoanStatus.Cancelled;
            _unitOfWork.Loans.Update(loan);

            await _unitOfWork.LoanAuditLogs.AddAsync(new LoanAuditLog
            {
                LoanId = loanId,
                Action = "Anulación",
                ChangesDescription = "El préstamo fue anulado manualmente por el administrador.",
                Date = DateTime.Now
            });

            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<bool> ReactivateLoanAsync(int loanId)
        {
            var loan = await _unitOfWork.Loans.GetByIdAsync(loanId);
            if (loan == null) return false;

            if (loan.Status != LoanStatus.Cancelled) return false; // Only cancelled loans can be reactivated

            loan.Status = LoanStatus.Active; // Simplest assumption; could also check if it should be Overdue
            _unitOfWork.Loans.Update(loan);

            await _unitOfWork.LoanAuditLogs.AddAsync(new LoanAuditLog
            {
                LoanId = loanId,
                Action = "Reactivación",
                ChangesDescription = "El préstamo fue reactivado tras haber sido anulado.",
                Date = DateTime.Now
            });

            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<IEnumerable<PaymentDto>> GetLoanPaymentsAsync(int loanId)
        {
            var payments = await _unitOfWork.Payments.FindAsync(p => p.LoanId == loanId);
            return _mapper.Map<IEnumerable<PaymentDto>>(payments.OrderByDescending(p => p.PaymentDate));
        }

        public async Task<IEnumerable<LoanAuditLogDto>> GetLoanAuditsAsync(int loanId)
        {
            var audits = await _unitOfWork.LoanAuditLogs.FindAsync(a => a.LoanId == loanId);
            return _mapper.Map<IEnumerable<LoanAuditLogDto>>(audits.OrderByDescending(a => a.Date));
        }

        public async Task<bool> UpdateLoanAsync(int loanId, UpdateLoanRequest request)
        {
            var loan = await _unitOfWork.Loans.GetByIdAsync(loanId);
            if (loan == null) return false;

            var oldValues = $"Cliente: {loan.ClientName}, Monto: {loan.Amount}, Tasa: {loan.InterestRate}%, Cuotas: {loan.InstallmentsCount}, Frecuencia: {loan.Frequency}, Inicio: {loan.StartDate.ToShortDateString()}";

            var payments = await _unitOfWork.Payments.FindAsync(p => p.LoanId == loanId);
            if (payments.Any())
            {
                // Can only update ClientName if payments exist
                loan.ClientName = request.ClientName;
                _unitOfWork.Loans.Update(loan);
                
                await _unitOfWork.LoanAuditLogs.AddAsync(new LoanAuditLog
                {
                    LoanId = loanId,
                    Action = "Edición General",
                    ChangesDescription = $"Se actualizó el nombre del cliente a: {request.ClientName}. Los campos financieros no fueron modificados porque el préstamo tiene cobros.",
                    Date = DateTime.Now
                });

                await _unitOfWork.CompleteAsync();
                return true;
            }

            // If no payments, we can update everything and regenerate installments
            loan.ClientName = request.ClientName;
            loan.Amount = request.Amount;
            loan.InterestRate = request.InterestRate;
            loan.LateFeeRate = request.LateFeeRate;
            loan.Frequency = request.Frequency;
            loan.InstallmentsCount = request.InstallmentsCount;
            loan.StartDate = request.StartDate;

            // Recalculate totals
            var totalInterest = loan.Amount * (loan.InterestRate / 100);
            loan.TotalToPay = loan.Amount + totalInterest;
            loan.BalanceDue = loan.TotalToPay;

            var existingInstallments = await _unitOfWork.Installments.FindAsync(i => i.LoanId == loanId);
            foreach (var inst in existingInstallments)
            {
                _unitOfWork.Installments.Delete(inst);
            }

            var baseInstallmentAmount = loan.TotalToPay / loan.InstallmentsCount;
            var newInstallments = new List<Installment>();
            for (int i = 1; i <= loan.InstallmentsCount; i++)
            {
                var dueDate = CalculateDueDate(loan.StartDate, loan.Frequency, i);
                newInstallments.Add(new Installment
                {
                    InstallmentNumber = i,
                    DueDate = dueDate,
                    Amount = baseInstallmentAmount,
                    PrincipalAmount = loan.Amount / loan.InstallmentsCount,
                    InterestAmount = totalInterest / loan.InstallmentsCount,
                    Status = InstallmentStatus.Pending
                });
                loan.EndDate = dueDate;
            }

            loan.Installments = newInstallments;
            
            _unitOfWork.Loans.Update(loan);

            var newValues = $"Cliente: {loan.ClientName}, Monto: {loan.Amount}, Tasa: {loan.InterestRate}%, Cuotas: {loan.InstallmentsCount}, Frecuencia: {loan.Frequency}, Inicio: {loan.StartDate.ToShortDateString()}";

            await _unitOfWork.LoanAuditLogs.AddAsync(new LoanAuditLog
            {
                LoanId = loanId,
                Action = "Reestructuración",
                ChangesDescription = $"Cambio completo de condiciones. ANTES: [{oldValues}] | AHORA: [{newValues}]",
                Date = DateTime.Now
            });

            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> DeleteLoanAsync(int loanId)
        {
            try
            {
                var loan = await _unitOfWork.Loans.GetByIdAsync(loanId);
                if (loan == null) return false;

                // 1. Delete Financial Transactions related to this loan
                var transactions = await _unitOfWork.FinancialTransactions.FindAsync(t => t.LoanId == loanId);
                foreach (var tx in transactions) _unitOfWork.FinancialTransactions.Delete(tx);

                // 2. Delete Payments (and ensure their transactions are nullified or deleted)
                var payments = await _unitOfWork.Payments.FindAsync(p => p.LoanId == loanId);
                foreach (var p in payments)
                {
                    // Find transactions linked to this specific payment that might not have LoanId
                    var paymentTxs = await _unitOfWork.FinancialTransactions.FindAsync(t => t.PaymentId == p.Id);
                    foreach (var ptx in paymentTxs) _unitOfWork.FinancialTransactions.Delete(ptx);
                    
                    _unitOfWork.Payments.Delete(p);
                }

                // 3. Delete Installments
                var installments = await _unitOfWork.Installments.FindAsync(i => i.LoanId == loanId);
                foreach (var i in installments) _unitOfWork.Installments.Delete(i);

                // 4. Delete Audit Logs
                var audits = await _unitOfWork.LoanAuditLogs.FindAsync(a => a.LoanId == loanId);
                foreach (var a in audits) _unitOfWork.LoanAuditLogs.Delete(a);

                // 5. Finally delete the Loan
                _unitOfWork.Loans.Delete(loan);

                await _unitOfWork.CompleteAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting loan {loanId}: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                
                throw new Exception($"Error de base de datos al eliminar: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        private DateTime CalculateDueDate(DateTime start, LoanFrequency freq, int installmentNumber)
        {
            return freq switch
            {
                LoanFrequency.Diario => start.AddDays(installmentNumber),
                LoanFrequency.Semanal => start.AddDays(installmentNumber * 7),
                LoanFrequency.Quincenal => start.AddDays(installmentNumber * 15),
                LoanFrequency.Mensual => start.AddMonths(installmentNumber),
                _ => start.AddDays(installmentNumber)
            };
        }

        private DateTime CalculateEndDate(DateTime start, LoanFrequency freq, int count)
        {
            return CalculateDueDate(start, freq, count);
        }
    }
}
