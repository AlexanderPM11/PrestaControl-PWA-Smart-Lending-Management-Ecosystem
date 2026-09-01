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

            if (request.CapitalAmount > loan.BalanceDue + 0.01m) // Adding tiny buffer for rounding
                throw new Exception($"El abono a capital (${request.CapitalAmount}) supera el saldo pendiente (${loan.BalanceDue})");

            var remainingCapital = request.CapitalAmount;
            var transactions = new List<FinancialTransaction>();

            // 1. Process Interest
            if (request.InterestAmount > 0)
            {
                transactions.Add(CreateTransaction(loan.Id, userId, request.InterestAmount, "Interés", "Pago de interés libre"));
            }

            // 2. Process Capital & Installments
            if (remainingCapital > 0)
            {
                transactions.Add(CreateTransaction(loan.Id, userId, request.CapitalAmount, "Capital", "Abono a capital"));

                var pendingInstallments = loan.Installments
                    .Where(i => i.Status != InstallmentStatus.Paid)
                    .OrderBy(i => i.DueDate)
                    .ToList();

                foreach (var inst in pendingInstallments)
                {
                    if (remainingCapital <= 0) break;

                    var unpaidPrincipal = inst.Amount - inst.PaidAmount;
                    if (unpaidPrincipal > 0)
                    {
                        var principalToPay = Math.Min(remainingCapital, unpaidPrincipal);
                        inst.PaidAmount += principalToPay;
                        remainingCapital -= principalToPay;
                    }

                    // Update Status
                    if (inst.PaidAmount >= inst.Amount)
                    {
                        inst.Status = InstallmentStatus.Paid;
                        inst.PaidAt = Prestacontrol.Application.Common.DRTimeProvider.Now;
                    }
                    else if (inst.PaidAmount > 0)
                    {
                        inst.Status = InstallmentStatus.Partial;
                    }
                }
            }

            // Update Loan Balance
            loan.BalanceDue -= request.CapitalAmount;
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
                Date = Prestacontrol.Application.Common.DRTimeProvider.Now
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

        public async Task<bool> EditPaymentAsync(int paymentId, EditPaymentRequest request, int userId)
        {
            var payment = await _unitOfWork.Payments.GetByIdAsync(paymentId);
            if (payment == null) return false;

            var loan = await _unitOfWork.Loans.GetByIdAsync(payment.LoanId);
            if (loan == null) return false;

            var transactions = await _unitOfWork.FinancialTransactions.FindAsync(t => t.PaymentId == paymentId);
            var capitalTx = transactions.FirstOrDefault(t => t.Type == "Capital");
            var interestTx = transactions.FirstOrDefault(t => t.Type == "Interés");

            decimal oldCapital = capitalTx?.Amount ?? 0;
            decimal oldInterest = interestTx?.Amount ?? 0;
            decimal oldTotal = payment.Amount;

            // Revert old capital
            loan.BalanceDue += oldCapital;

            // Check if new capital is valid
            if (request.CapitalAmount > loan.BalanceDue + 0.01m)
                throw new Exception($"El abono a capital ({request.CapitalAmount}) supera el saldo pendiente ({loan.BalanceDue})");

            // Apply new capital
            loan.BalanceDue -= request.CapitalAmount;
            if (loan.BalanceDue <= 0)
            {
                loan.Status = LoanStatus.Paid;
                loan.BalanceDue = 0;
            }
            else
            {
                loan.Status = LoanStatus.Active; // Re-activate if it was fully paid but now isn't
            }

            _unitOfWork.Loans.Update(loan);

            // Update Payment
            decimal newTotal = request.CapitalAmount + request.InterestAmount;
            payment.Amount = newTotal;
            if (request.Notes != null) payment.Notes = request.Notes;
            _unitOfWork.Payments.Update(payment);

            // Update or Create Capital Tx
            if (request.CapitalAmount > 0)
            {
                if (capitalTx != null)
                {
                    capitalTx.Amount = request.CapitalAmount;
                    _unitOfWork.FinancialTransactions.Update(capitalTx);
                }
                else
                {
                    await _unitOfWork.FinancialTransactions.AddAsync(CreateTransaction(loan.Id, userId, request.CapitalAmount, "Capital", "Abono a capital", payment.Id));
                }
            }
            else if (capitalTx != null)
            {
                _unitOfWork.FinancialTransactions.Delete(capitalTx);
            }

            // Update or Create Interest Tx
            if (request.InterestAmount > 0)
            {
                if (interestTx != null)
                {
                    interestTx.Amount = request.InterestAmount;
                    _unitOfWork.FinancialTransactions.Update(interestTx);
                }
                else
                {
                    await _unitOfWork.FinancialTransactions.AddAsync(CreateTransaction(loan.Id, userId, request.InterestAmount, "Interés", "Pago de interés", payment.Id));
                }
            }
            else if (interestTx != null)
            {
                _unitOfWork.FinancialTransactions.Delete(interestTx);
            }

            // Cashflow adjustment
            decimal difference = newTotal - oldTotal;
            if (difference != 0)
            {
                await _unitOfWork.CashFlows.AddAsync(new CashFlow
                {
                    Amount = Math.Abs(difference),
                    Type = difference > 0 ? CashFlowType.Income : CashFlowType.Outcome,
                    Category = "Ajuste",
                    Description = $"Ajuste por edición de pago #{paymentId} del préstamo #{loan.Id}",
                    UserId = userId,
                    Date = Prestacontrol.Application.Common.DRTimeProvider.Now
                });
            }

            await _unitOfWork.CompleteAsync();
            return true;
        }

        private FinancialTransaction CreateTransaction(int loanId, int userId, decimal amount, string type, string desc, int? paymentId = null)
        {
            return new FinancialTransaction
            {
                LoanId = loanId,
                PaymentId = paymentId,
                UserId = userId,
                Amount = amount,
                Type = type,
                Description = desc,
                Date = Prestacontrol.Application.Common.DRTimeProvider.Now
            };
        }
    }
}
