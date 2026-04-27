using AutoMapper;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Enums;
using Prestacontrol.Domain.Interfaces;

namespace Prestacontrol.Application.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public PaymentService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<TransactionDto>> ProcessPaymentAsync(PaymentRequest request, int userId)
        {
            var loan = await _unitOfWork.Loans.GetByIdAsync(request.LoanId);
            if (loan == null) throw new Exception("Préstamo no encontrado");

            if (request.Amount > loan.BalanceDue + 0.01m) // Adding tiny buffer for rounding
                throw new Exception($"El monto a pagar (${request.Amount}) supera el saldo pendiente (${loan.BalanceDue})");

            var remainingAmount = request.Amount;
            var transactions = new List<FinancialTransaction>();

            // 1. Get pending installments ordered by date
            var pendingInstallments = loan.Installments
                .Where(i => i.Status != InstallmentStatus.Paid)
                .OrderBy(i => i.DueDate)
                .ToList();

            foreach (var inst in pendingInstallments)
            {
                if (remainingAmount <= 0) break;

                // A. Pay Late Fees first (if any)
                if (inst.LateFeeAmount > 0)
                {
                    var lateFeeToPay = Math.Min(remainingAmount, inst.LateFeeAmount);
                    inst.LateFeeAmount -= lateFeeToPay;
                    remainingAmount -= lateFeeToPay;
                    
                    transactions.Add(CreateTransaction(loan.Id, userId, lateFeeToPay, "Mora", $"Pago mora cuota #{inst.InstallmentNumber}"));
                }

                if (remainingAmount <= 0) break;

                // B. Pay Interest (Interest is paid before Principal)
                var interestPaid = Math.Min(inst.PaidAmount, inst.InterestAmount);
                var unpaidInterest = inst.InterestAmount - interestPaid;
                
                if (unpaidInterest > 0)
                {
                    var interestToPay = Math.Min(remainingAmount, unpaidInterest);
                    inst.PaidAmount += interestToPay;
                    remainingAmount -= interestToPay;
                    
                    transactions.Add(CreateTransaction(loan.Id, userId, interestToPay, "Interés", $"Pago interés cuota #{inst.InstallmentNumber}"));
                }

                if (remainingAmount <= 0) break;

                // C. Pay Principal
                var principalPaid = Math.Max(0, inst.PaidAmount - inst.InterestAmount);
                var unpaidPrincipal = inst.PrincipalAmount - principalPaid;
                
                if (unpaidPrincipal > 0)
                {
                    var principalToPay = Math.Min(remainingAmount, unpaidPrincipal);
                    inst.PaidAmount += principalToPay;
                    remainingAmount -= principalToPay;
                    
                    transactions.Add(CreateTransaction(loan.Id, userId, principalToPay, "Capital", $"Pago capital cuota #{inst.InstallmentNumber}"));
                }

                // Update Status
                if (inst.PaidAmount >= inst.Amount)
                {
                    inst.Status = InstallmentStatus.Paid;
                    inst.PaidAt = DateTime.Now;
                }
                else if (inst.PaidAmount > 0)
                {
                    inst.Status = InstallmentStatus.Partial;
                }
            }

            // Update Loan Balance
            loan.BalanceDue -= request.Amount;
            if (loan.BalanceDue <= 0)
            {
                loan.Status = LoanStatus.Paid;
                loan.BalanceDue = 0;
            }

            // Save Payment record
            var payment = new Payment
            {
                LoanId = loan.Id,
                UserId = userId,
                Amount = request.Amount,
                PaymentDate = request.PaymentDate,
                PaymentMethod = request.PaymentMethod,
                Notes = request.Notes
            };

            await _unitOfWork.Payments.AddAsync(payment);

            // Record Income in CashFlow
            await _unitOfWork.CashFlows.AddAsync(new CashFlow
            {
                Amount = request.Amount,
                Type = CashFlowType.Income,
                Category = "Cobro",
                Description = $"Cobro de préstamo #{loan.Id} - Cliente: {loan.ClientName}",
                UserId = userId,
                Date = DateTime.Now
            });

            // Save all transactions
            foreach (var tx in transactions)
            {
                tx.Payment = payment;
                await _unitOfWork.FinancialTransactions.AddAsync(tx);
            }

            await _unitOfWork.CompleteAsync();

            return _mapper.Map<IEnumerable<TransactionDto>>(transactions);
        }

        public async Task<IEnumerable<LoanDto>> GetPendingLoansAsync()
        {
            var loans = await _unitOfWork.Loans.FindAsync(l => l.Status == LoanStatus.Active || l.Status == LoanStatus.Overdue);
            return _mapper.Map<IEnumerable<LoanDto>>(loans);
        }

        private FinancialTransaction CreateTransaction(int loanId, int userId, decimal amount, string type, string desc)
        {
            return new FinancialTransaction
            {
                LoanId = loanId,
                UserId = userId,
                Amount = amount,
                Type = type,
                Description = desc,
                Date = DateTime.Now
            };
        }
    }
}
