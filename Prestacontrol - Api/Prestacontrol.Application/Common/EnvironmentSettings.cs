using Microsoft.Extensions.Configuration;

namespace Prestacontrol.Application.Common
{
    public static class EnvironmentSettings
    {
        public static string GetValue(IConfiguration config, string section, string key)
        {
            var envVarName = $"{section}__{key}";
            var envValue = Environment.GetEnvironmentVariable(envVarName);

            if (!string.IsNullOrEmpty(envValue))
                return envValue;

            return config[$"{section}:{key}"] ?? string.Empty;
        }

        public static string TelegramBotToken(IConfiguration config) => GetValue(config, "Telegram", "BotToken");
        public static string TelegramAdminChatId(IConfiguration config) => GetValue(config, "Telegram", "AdminChatId");

        public static string JwtKey(IConfiguration config) => GetValue(config, "Jwt", "Key");
        public static string JwtIssuer(IConfiguration config) => GetValue(config, "Jwt", "Issuer");
        public static string JwtAudience(IConfiguration config) => GetValue(config, "Jwt", "Audience");

        public static string DefaultConnection(IConfiguration config)
        {
            var envValue = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            return !string.IsNullOrEmpty(envValue) ? envValue : config.GetConnectionString("DefaultConnection") ?? string.Empty;
        }
    }
}
