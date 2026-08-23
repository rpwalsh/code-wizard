// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using System.Globalization;

namespace Exercise;

/// <summary>An amount in a currency. Two of these saying the same thing are equal.</summary>
public sealed record Money(decimal Amount, string Currency);

public sealed class CurrencyMismatchException : InvalidOperationException
{
    public CurrencyMismatchException(string left, string right)
        : base($"cannot mix {left} and {right}")
    {
    }
}

public static class Wallet
{
    public static Money Add(Money left, Money right)
    {
        if (left.Currency != right.Currency)
        {
            throw new CurrencyMismatchException(left.Currency, right.Currency);
        }

        return left with { Amount = left.Amount + right.Amount };
    }

    public static Money Convert(Money money, string target, decimal rate)
    {
        // A copy with two fields changed; the original Money is untouched.
        return money with { Amount = money.Amount * rate, Currency = target };
    }

    public static bool TryParse(string? text, out Money money)
    {
        money = new Money(0, "");
        if (text is null)
        {
            return false;
        }

        var parts = text.Split(' ');
        if (parts.Length != 2)
        {
            return false;
        }

        var code = parts[1];
        if (code.Length != 3 || !code.All(char.IsUpper))
        {
            return false;
        }

        // Invariant culture: "12.50" must parse the same in every region.
        if (!decimal.TryParse(parts[0], NumberStyles.Number, CultureInfo.InvariantCulture, out var amount))
        {
            return false;
        }

        money = new Money(amount, code);
        return true;
    }

    public static string Describe(Money? money) => money switch
    {
        // Null is a case like any other, and deleting this arm is a compiler
        // warning — which is what makes the handling a fact rather than a hope.
        null => "nothing",
        { Amount: 0 } => "free",
        _ => string.Create(
            CultureInfo.InvariantCulture,
            $"{money.Amount:0.00} {money.Currency}"),
    };
}
