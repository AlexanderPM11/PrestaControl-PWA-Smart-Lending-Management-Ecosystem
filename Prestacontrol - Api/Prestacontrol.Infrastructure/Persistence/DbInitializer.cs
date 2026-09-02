using Microsoft.EntityFrameworkCore;
using Prestacontrol.Domain.Entities;
using Prestacontrol.Domain.Enums;
using Prestacontrol.Application.Common;

namespace Prestacontrol.Infrastructure.Persistence
{
    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context)
        {
            // Apply pending migrations
            try
            {
                if ((await context.Database.GetPendingMigrationsAsync()).Any())
                {
                    await context.Database.MigrateAsync();
                }
            }
            catch (Exception ex)
            {
                // Continue with idempotent repairs for databases restored
                // with an incomplete or stale EF migration history.
                Console.Error.WriteLine($"Database migrations did not complete: {ex.Message}");
            }

            // Custom compatibility tables and repairs must run after the
            // EF migrations. Running them first breaks a fresh database
            // because base tables such as Loans do not exist yet.
            await EnsureAuditSchema(context);
            // A restored database may report migrations as applied while a
            // configuration table is missing. Repair that drift before the
            // background workers start querying it.
            await EnsureSystemConfigSchema(context);
            await EnsureUsersSchema(context);
            await EnsureClientsSchema(context);

            // Seed initial data
            if (!await context.Users.AnyAsync())
            {
                var admin = new User
                {
                    FullName = "Administrador Sistema",
                    Username = "admin",
                    PasswordHash = PasswordHasher.Hash("admin123"),
                    Role = UserRole.Admin,
                    IsActive = true
                };

                await context.Users.AddAsync(admin);
                await context.SaveChangesAsync();
            }
        }

        private static async Task EnsureAuditSchema(ApplicationDbContext context)
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `AuditLogs` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `CreatedAt` datetime(6) NOT NULL,
                    `UpdatedAt` datetime(6) NULL,
                    `UserId` int NULL,
                    `Username` varchar(100) NOT NULL,
                    `Module` varchar(80) NOT NULL,
                    `Action` varchar(120) NOT NULL,
                    `EntityType` varchar(80) NULL,
                    `EntityId` int NULL,
                    `Details` text NULL,
                    `OccurredAt` datetime(6) NOT NULL,
                    PRIMARY KEY (`Id`),
                    INDEX `IX_AuditLogs_OccurredAt` (`OccurredAt`),
                    INDEX `IX_AuditLogs_Module` (`Module`)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;");
        }

        private static async Task EnsureSystemConfigSchema(ApplicationDbContext context)
        {
            var tableExists = await context.Database.SqlQueryRaw<int>(@"
                SELECT COUNT(*) AS `Value`
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'SystemConfigs'").SingleAsync() > 0;

            if (tableExists) return;

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `SystemConfigs` (
                    `Key` varchar(255) NOT NULL,
                    `Value` longtext NOT NULL,
                    `UpdatedAt` datetime(6) NOT NULL,
                    PRIMARY KEY (`Key`)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;");
        }

        private static async Task EnsureUsersSchema(ApplicationDbContext context)
        {
            var tableExists = await context.Database.SqlQueryRaw<int>(@"
                SELECT COUNT(*) AS `Value`
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'Users'").SingleAsync() > 0;

            if (tableExists) return;

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `Users` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `FullName` longtext NOT NULL,
                    `Username` varchar(255) NOT NULL,
                    `PasswordHash` longtext NOT NULL,
                    `Role` int NOT NULL,
                    `IsActive` tinyint(1) NOT NULL,
                    `CreatedAt` datetime(6) NOT NULL,
                    `UpdatedAt` datetime(6) NULL,
                    PRIMARY KEY (`Id`),
                    UNIQUE INDEX `IX_Users_Username` (`Username`)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;");
        }

        private static async Task EnsureClientsSchema(ApplicationDbContext context)
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `Clients` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `CreatedAt` datetime(6) NOT NULL,
                    `UpdatedAt` datetime(6) NULL,
                    `FullName` varchar(200) NOT NULL,
                    `Phone` varchar(50) NULL,
                    `DocumentId` varchar(50) NULL,
                    `Address` varchar(300) NULL,
                    `Notes` varchar(1000) NULL,
                    `IsActive` tinyint(1) NOT NULL DEFAULT 1,
                    PRIMARY KEY (`Id`)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;");

            var clientIdColumnExists = await context.Database.SqlQueryRaw<int>(@"
                SELECT COUNT(*) AS `Value`
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'Loans'
                  AND COLUMN_NAME = 'ClientId'").SingleAsync() > 0;

            if (!clientIdColumnExists)
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE `Loans` ADD COLUMN `ClientId` int NULL;");
            }

            // Link legacy loans to one client record without changing their
            // stored ClientName or financial history.
            await context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO `Clients` (`CreatedAt`, `FullName`, `IsActive`)
                SELECT UTC_TIMESTAMP(6), l.`ClientName`, 1
                FROM `Loans` l
                LEFT JOIN `Clients` c ON CONVERT(LOWER(c.`FullName`) USING utf8mb4) COLLATE utf8mb4_general_ci = CONVERT(LOWER(l.`ClientName`) USING utf8mb4) COLLATE utf8mb4_general_ci
                WHERE c.`Id` IS NULL AND l.`ClientName` <> ''
                GROUP BY l.`ClientName`;");

            await context.Database.ExecuteSqlRawAsync(@"
                UPDATE `Loans` l
                INNER JOIN `Clients` c ON CONVERT(LOWER(c.`FullName`) USING utf8mb4) COLLATE utf8mb4_general_ci = CONVERT(LOWER(l.`ClientName`) USING utf8mb4) COLLATE utf8mb4_general_ci
                SET l.`ClientId` = c.`Id`
                WHERE l.`ClientId` IS NULL;");
        }
    }
}
