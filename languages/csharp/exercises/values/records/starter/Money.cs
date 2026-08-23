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
        throw new NotImplementedException();
    }

    public static Money Convert(Money money, string target, decimal rate)
    {
        throw new NotImplementedException();
    }

    public static bool TryParse(string? text, out Money money)
    {
        throw new NotImplementedException();
    }

    public static string Describe(Money? money)
    {
        throw new NotImplementedException();
    }
}
