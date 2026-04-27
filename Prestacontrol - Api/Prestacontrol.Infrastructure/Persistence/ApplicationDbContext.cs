using Microsoft.EntityFrameworkCore;
using Prestacontrol.Domain.Entities;

namespace Prestacontrol.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }

        public DbSet<Loan> Loans { get; set; }
        public DbSet<Installment> Installments { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<CashFlow> CashFlows { get; set; } = null!;
        public DbSet<FinancialTransaction> FinancialTransactions { get; set; } = null!;
        public DbSet<SystemConfig> SystemConfigs { get; set; } = null!;
        public DbSet<LoanAuditLog> LoanAuditLogs { get; set; } = null!;
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity => {
                entity.HasIndex(e => e.Username).IsUnique();
            });


            // Loan configuration
            modelBuilder.Entity<Loan>(entity => {
                entity.Property(e => e.Amount).HasPrecision(15, 2);
                entity.Property(e => e.InterestRate).HasPrecision(5, 2);
                entity.Property(e => e.LateFeeRate).HasPrecision(5, 2);
                entity.Property(e => e.TotalToPay).HasPrecision(15, 2);
                entity.Property(e => e.BalanceDue).HasPrecision(15, 2);



                entity.HasOne(e => e.User)
                    .WithMany(u => u.CreatedLoans)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Installment configuration
            modelBuilder.Entity<Installment>(entity => {
                entity.Property(e => e.Amount).HasPrecision(15, 2);
                entity.Property(e => e.PrincipalAmount).HasPrecision(15, 2);
                entity.Property(e => e.InterestAmount).HasPrecision(15, 2);
                entity.Property(e => e.LateFeeAmount).HasPrecision(15, 2);
                entity.Property(e => e.PaidAmount).HasPrecision(15, 2);
                entity.Property(e => e.ArrearsAmount).HasPrecision(15, 2);

                entity.HasOne(e => e.Loan)
                    .WithMany(l => l.Installments)
                    .HasForeignKey(e => e.LoanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Payment configuration
            modelBuilder.Entity<Payment>(entity => {
                entity.Property(e => e.Amount).HasPrecision(15, 2);

                entity.HasOne(e => e.Loan)
                    .WithMany(l => l.Payments)
                    .HasForeignKey(e => e.LoanId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.CollectedPayments)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // CashFlow configuration
            modelBuilder.Entity<CashFlow>(entity => {
                entity.Property(e => e.Amount).HasPrecision(15, 2);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.RegisteredCashFlows)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // FinancialTransaction configuration
            modelBuilder.Entity<FinancialTransaction>(entity => {
                entity.Property(e => e.Amount).HasPrecision(15, 2);

                entity.HasOne(e => e.Loan)
                    .WithMany()
                    .HasForeignKey(e => e.LoanId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Payment)
                    .WithMany()
                    .HasForeignKey(e => e.PaymentId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // SystemConfig configuration
            modelBuilder.Entity<SystemConfig>(entity => {
                entity.HasKey(e => e.Key);
            });
        }
    }
}
