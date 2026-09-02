using System.Collections.Concurrent;

namespace Prestacontrol.API.Services;

public sealed class LoginRateLimiter
{
    private sealed record AttemptState(int Failures, DateTimeOffset? BlockedUntil);
    private readonly ConcurrentDictionary<string, AttemptState> _attempts = new();
    private const int MaxFailures = 5;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan BlockDuration = TimeSpan.FromMinutes(5);

    public bool IsBlocked(string key, out TimeSpan retryAfter)
    {
        retryAfter = TimeSpan.Zero;
        if (!_attempts.TryGetValue(key, out var state)) return false;
        if (state.BlockedUntil is { } until && until > DateTimeOffset.UtcNow)
        {
            retryAfter = until - DateTimeOffset.UtcNow;
            return true;
        }
        if (state.BlockedUntil is not null || state.Failures == 0) _attempts.TryRemove(key, out _);
        return false;
    }

    public void RecordFailure(string key)
    {
        _attempts.AddOrUpdate(key,
            _ => new AttemptState(1, null),
            (_, current) =>
            {
                if (current.BlockedUntil is { } until && until > DateTimeOffset.UtcNow) return current;
                var failures = current.Failures + 1;
                return failures >= MaxFailures
                    ? new AttemptState(failures, DateTimeOffset.UtcNow.Add(BlockDuration))
                    : new AttemptState(failures, null);
            });
    }

    public void Reset(string key) => _attempts.TryRemove(key, out _);

    public void CleanupExpired()
    {
        foreach (var item in _attempts)
            if (item.Value.BlockedUntil is { } until && until.Add(Window) < DateTimeOffset.UtcNow)
                _attempts.TryRemove(item.Key, out _);
    }
}
