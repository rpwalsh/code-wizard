// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class MoneyTests
{
    [RetrainerTest("records with the same content are equal", Concept = "csharp.values.records")]
    public void ValueEquality()
    {
        Assert.Equal(new Money(5, "USD"), new Money(5, "USD"));
    }

    [RetrainerTest("adding keeps the currency", Concept = "csharp.values.records")]
    public void Adds()
    {
        Assert.Equal(new Money(8.5m, "USD"), Wallet.Add(new Money(5, "USD"), new Money(3.5m, "USD")));
    }

    [RetrainerTest("mixing currencies is refused by name", Concept = "csharp.values.records")]
    public void RefusesMixing()
    {
        var error = Assert.Throws<CurrencyMismatchException>(
            () => Wallet.Add(new Money(5, "USD"), new Money(5, "EUR")));
        Assert.True(error.Message.Contains("USD") && error.Message.Contains("EUR"),
            "the message should name both currencies");
    }

    [RetrainerTest("converting builds a new Money and leaves the old one alone", Concept = "csharp.values.records")]
    public void ConvertCopies()
    {
        var dollars = new Money(10, "USD");
        var euros = Wallet.Convert(dollars, "EUR", 0.9m);

        Assert.Equal(new Money(9, "EUR"), euros);
        Assert.Equal(new Money(10, "USD"), dollars);
    }

    [RetrainerTest("a well-formed string parses", Concept = "csharp.values.records")]
    public void Parses()
    {
        Assert.True(Wallet.TryParse("12.50 USD", out var money));
        Assert.Equal(new Money(12.50m, "USD"), money);
    }

    [RetrainerTest("describe prints two decimal places", Concept = "csharp.types.patterns")]
    public void Describes()
    {
        Assert.Equal("12.50 USD", Wallet.Describe(new Money(12.5m, "USD")));
    }
}
