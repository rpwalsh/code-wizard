// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public record Sale(string Region, string Product, int Quantity, decimal UnitPrice);

public static class Reports
{
    public static decimal Revenue(IEnumerable<Sale> sales)
    {
        throw new NotImplementedException();
    }

    public static IReadOnlyDictionary<string, decimal> RevenueByRegion(IEnumerable<Sale> sales)
    {
        throw new NotImplementedException();
    }

    public static IReadOnlyList<string> TopProducts(IEnumerable<Sale> sales, int count)
    {
        throw new NotImplementedException();
    }

    public static IReadOnlyList<(string Region, int Distinct)> ProductSpread(IEnumerable<Sale> sales)
    {
        throw new NotImplementedException();
    }

    public static decimal? BiggestSale(IEnumerable<Sale> sales)
    {
        throw new NotImplementedException();
    }
}
