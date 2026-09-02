using System.Security.Cryptography;

namespace Prestacontrol.Application.Common;

public static class PasswordHasher
{
    private const string Prefix = "PC$PBKDF2$1$";
    private const int Iterations = 600_000;
    private const int SaltSize = 32;
    private const int HashSize = 32;

    public static string Hash(string password)
    {
        if (string.IsNullOrWhiteSpace(password)) throw new ArgumentException("La contraseña no puede estar vacía.", nameof(password));
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);
        return $"{Prefix}{Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string stored, out bool needsMigration)
    {
        needsMigration = false;
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(stored)) return false;

        if (!stored.StartsWith(Prefix, StringComparison.Ordinal))
        {
            needsMigration = true;
            return CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(password),
                System.Text.Encoding.UTF8.GetBytes(stored));
        }

        var parts = stored.Split('$');
        if (parts.Length != 5 || !int.TryParse(parts[2], out var iterations)) return false;
        try
        {
            var salt = Convert.FromBase64String(parts[3]);
            var expected = Convert.FromBase64String(parts[4]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException) { return false; }
    }
}
