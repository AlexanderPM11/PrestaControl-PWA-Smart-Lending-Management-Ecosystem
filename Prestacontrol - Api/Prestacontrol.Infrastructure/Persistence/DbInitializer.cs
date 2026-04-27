using Microsoft.EntityFrameworkCore;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Enums;

namespace Prestacontrol.Infrastructure.Persistence
{
    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context)
        {
            // Apply pending migrations
            if ((await context.Database.GetPendingMigrationsAsync()).Any())
            {
                await context.Database.MigrateAsync();
            }

            // Seed initial data
            if (!await context.Users.AnyAsync())
            {
                var admin = new User
                {
                    FullName = "Administrador Sistema",
                    Username = "admin",
                    PasswordHash = "admin123", // Using plain for demo as per current AuthService
                    Role = UserRole.Admin,
                    IsActive = true
                };

                await context.Users.AddAsync(admin);
                await context.SaveChangesAsync();
            }
        }
    }
}
