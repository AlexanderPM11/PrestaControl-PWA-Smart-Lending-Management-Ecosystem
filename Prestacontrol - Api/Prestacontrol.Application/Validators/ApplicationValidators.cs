using FluentValidation;
using Prestacontrol.Application.DTOs;

namespace Prestacontrol.Application.Validators
{


    public class CreateLoanValidator : AbstractValidator<CreateLoanRequest>
    {
        public CreateLoanValidator()
        {
            RuleFor(x => x.ClientName).NotEmpty();
            RuleFor(x => x.Amount).GreaterThan(0);
            RuleFor(x => x.InterestRate).InclusiveBetween(0, 100);
            RuleFor(x => x.InstallmentsCount).GreaterThan(0);
            RuleFor(x => x.StartDate).NotEmpty();
        }
    }

    public class LoginValidator : AbstractValidator<LoginRequest>
    {
        public LoginValidator()
        {
            RuleFor(x => x.Username).NotEmpty();
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}
