// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public record Sale(string Region, string Product, int Quantity, decimal UnitPrice);

public static class Reports
{
    public static decimal Revenue(IEnumerable<Sale> sales) =>
        sales.Sum(sale => sale.Quantity * sale.UnitPrice);

    public static IReadOnlyDictionary<string, decimal> RevenueByRegion(IEnumerable<Sale> sales) =>
        sales
            .GroupBy(sale => sale.Region)
            .ToDictionary(group => group.Key, group => Revenue(group));

    public static IReadOnlyList<string> TopProducts(IEnumerable<Sale> sales, int count) =>
        sales
            .GroupBy(sale => sale.Product)
            .Select(group => new { Product = group.Key, Total = Revenue(group) })
            // Ordered by revenue, then by name: OrderByDescending alone leaves
            // ties in source order, which changes when the input does.
            .OrderByDescending(row => row.Total)
            .ThenBy(row => row.Product, StringComparer.Ordinal)
            .Take(count)
            .Select(row => row.Product)
            .ToList();

    public static IReadOnlyList<(string Region, int Distinct)> ProductSpread(IEnumerable<Sale> sales) =>
        sales
            .GroupBy(sale => sale.Region)
            .Select(group => (Region: group.Key, Distinct: group.Select(sale => sale.Product).Distinct().Count()))
            .OrderBy(row => row.Region, StringComparer.Ordinal)
            .ToList();

    public static decimal? BiggestSale(IEnumerable<Sale> sales)
    {
        // Max on an empty sequence of a value type throws. Projecting to a
        // nullable makes "there were none" an answer rather than an
        // exception, which is what a report wants.
        return sales.Max(sale => (decimal?)(sale.Quantity * sale.UnitPrice));
    }
}
