// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("null does not parse and does not throw", Concept = "csharp.values.nullable")]
    public void NullText()
    {
        Assert.False(Wallet.TryParse(null, out _));
    }

    [RetrainerTest("garbage does not parse", Concept = "csharp.values.nullable")]
    public void Garbage()
    {
        Assert.False(Wallet.TryParse("hello", out _));
        Assert.False(Wallet.TryParse("12.50", out _));
        Assert.False(Wallet.TryParse("12.50 usd", out _));
        Assert.False(Wallet.TryParse("12.50 USDX", out _));
        Assert.False(Wallet.TryParse("twelve USD", out _));
    }

    [RetrainerTest("describe handles null as a case, not a crash", Concept = "csharp.values.nullable")]
    public void DescribeNull()
    {
        Assert.Equal("nothing", Wallet.Describe(null));
    }

    [RetrainerTest("zero is free whatever the currency", Concept = "csharp.types.patterns")]
    public void DescribeZero()
    {
        Assert.Equal("free", Wallet.Describe(new Money(0, "EUR")));
    }

    [RetrainerTest("a whole number gains its decimals in print", Concept = "csharp.types.patterns")]
    public void WholeNumber()
    {
        Assert.Equal("3.00 GBP", Wallet.Describe(new Money(3, "GBP")));
    }

    [RetrainerTest("conversion multiplies exactly, in decimal", Concept = "csharp.values.records")]
    public void DecimalExactness()
    {
        // 0.1 + 0.2 style drift is a double problem; decimal does not have it.
        var converted = Wallet.Convert(new Money(0.1m, "USD"), "EUR", 3);
        Assert.Equal(new Money(0.3m, "EUR"), converted);
    }
}
