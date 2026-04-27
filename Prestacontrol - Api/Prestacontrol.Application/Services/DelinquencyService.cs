using AutoMapper;
using Prestacontrol.Application.DTOs;
using Prestacontrol.Application.Interfaces;
using Prestacontrol.Domain.Enums;
using Prestacontrol.Domain.Interfaces;

namespace Prestacontrol.Application.Services
{
    public class DelinquencyService : IDelinquencyService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public DelinquencyService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<int> UpdateDelinquencyStatusAsync()
        {
            var today = DateTime.Now.Date;
            var loans = await _unitOfWork.Loans.FindAsync(l => l.Status == LoanStatus.Active || l.Status == LoanStatus.Overdue);
            int updatedCount = 0;

            foreach (var loan in loans)
            {
                bool isLoanOverdue = false;
                foreach (var inst in loan.Installments.Where(i => i.Status != InstallmentStatus.Paid))
                {
                    if (inst.DueDate.Date < today)
                    {
                        isLoanOverdue = true;
                        inst.Status = InstallmentStatus.Overdue;
                        
                        // Calculate Late Fee
                        // Logic: LateFeeRate can be a percentage of the installment amount or a fixed daily fee.
                        // For this implementation, we'll assume it's a daily fixed amount for simplicity, 
                        // but it can be easily adjusted.
                        var daysOverdue = (today - inst.DueDate.Date).Days;
                        
                        // Let's assume LateFeeRate is a fixed daily amount
                        var newLateFee = daysOverdue * loan.LateFeeRate;
                        
                        if (newLateFee > inst.LateFeeAmount)
                        {
                            inst.LateFeeAmount = newLateFee;
                            updatedCount++;
                        }
                    }
                }

                if (isLoanOverdue)
                {
                    loan.Status = LoanStatus.Overdue;
                }
            }

            if (updatedCount > 0)
            {
                await _unitOfWork.CompleteAsync();
            }

            return updatedCount;
        }

        public async Task<IEnumerable<LoanDto>> GetDelinquentLoansAsync()
        {
            await UpdateDelinquencyStatusAsync(); // Refresh before returning
            var loans = await _unitOfWork.Loans.FindAsync(l => l.Status == LoanStatus.Overdue);
            return _mapper.Map<IEnumerable<LoanDto>>(loans);
        }
    }
}
