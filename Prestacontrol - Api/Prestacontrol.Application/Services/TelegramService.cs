using Microsoft.Extensions.Configuration;
using Prestacontrol.Application.Interfaces;
using System.Net.Http.Json;

namespace Prestacontrol.Application.Services
{
    public class TelegramService : ITelegramService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public TelegramService(IConfiguration config, HttpClient httpClient)
        {
            _config = config;
            _httpClient = httpClient;
        }

        public async Task SendMessageAsync(string message, string? chatId = null)
        {
            var token = Common.EnvironmentSettings.TelegramBotToken(_config);
            var targetChatId = chatId ?? Common.EnvironmentSettings.TelegramAdminChatId(_config);

            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(targetChatId))
                return;

            var url = $"https://api.telegram.org/bot{token}/sendMessage";
            var payload = new
            {
                chat_id = targetChatId,
                text = message,
                parse_mode = "HTML"
            };

            await _httpClient.PostAsJsonAsync(url, payload);
        }
    }
}
