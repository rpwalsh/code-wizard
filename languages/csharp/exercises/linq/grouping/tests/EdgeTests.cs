// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("an empty sequence reports nothing rather than throwing", Concept = "csharp.linq.deferred")]
    public void Empty()
    {
        var none = Array.Empty<Sale>();

        Assert.Equal(0m, Reports.Revenue(none));
        Assert.Equal(0, Reports.RevenueByRegion(none).Count);
        Assert.Equal(0, Reports.TopProducts(none, 3).Count);
        Assert.Equal(0, Reports.ProductSpread(none).Count);
        // Max over an empty sequence of decimal throws; over decimal? it is
        // null, which is the answer a report actually wants.
        Assert.Null(Reports.BiggestSale(none));
    }

    [RetrainerTest("a tie in revenue is broken by name, not by input order", Concept = "csharp.linq.queries")]
    public void TieBreak()
    {
        var forwards = new[]
        {
            new Sale("n", "beta", 1, 10m),
            new Sale("n", "alpha", 1, 10m),
        };
        var backwards = new[]
        {
            new Sale("n", "alpha", 1, 10m),
            new Sale("n", "beta", 1, 10m),
        };

        // Same data in a different order must produce the same ranking, or
        // the report disagrees with itself between runs.
        Assert.Sequence(new[] { "alpha", "beta" }, Reports.TopProducts(forwards, 2));
        Assert.Sequence(new[] { "alpha", "beta" }, Reports.TopProducts(backwards, 2));
    }

    [RetrainerTest("asking for more than exists returns what exists", Concept = "csharp.linq.queries")]
    public void TakeMore()
    {
        var sales = new[] { new Sale("n", "only", 1, 5m) };
        Assert.Sequence(new[] { "only" }, Reports.TopProducts(sales, 10));
        Assert.Equal(0, Reports.TopProducts(sales, 0).Count);
    }

    [RetrainerTest("the same product in one region counts once", Concept = "csharp.linq.queries")]
    public void DistinctCounts()
    {
        var sales = new[]
        {
            new Sale("n", "widget", 1, 1m),
            new Sale("n", "widget", 1, 1m),
            new Sale("n", "widget", 1, 1m),
        };

        Assert.Equal(1, Reports.ProductSpread(sales)[0].Distinct);
    }

    [RetrainerTest("the source is enumerated even when it is a lazy query", Concept = "csharp.linq.deferred")]
    public void LazySource()
    {
        var enumerations = 0;
        IEnumerable<Sale> Source()
        {
            enumerations += 1;
            yield return new Sale("n", "a", 1, 10m);
            yield return new Sale("n", "b", 2, 10m);
        }

        // Materialized once per call is fine; never materialized is not.
        Assert.Equal(30m, Reports.Revenue(Source()));
        Assert.Equal(1, enumerations);
    }

    [RetrainerTest("a zero quantity contributes nothing but is still a sale", Concept = "csharp.linq.queries")]
    public void ZeroQuantity()
    {
        var sales = new[]
        {
            new Sale("n", "free", 0, 99m),
            new Sale("n", "paid", 1, 5m),
        };

        Assert.Equal(5m, Reports.Revenue(sales));
        // Both products still exist in the region.
        Assert.Equal(2, Reports.ProductSpread(sales)[0].Distinct);
        Assert.Equal(5m, Reports.BiggestSale(sales));
    }

    [RetrainerTest("negative amounts are summed rather than ignored", Concept = "csharp.linq.queries")]
    public void Refunds()
    {
        var sales = new[]
        {
            new Sale("n", "widget", 2, 10m),
            new Sale("n", "widget", -1, 10m),
        };

        Assert.Equal(10m, Reports.Revenue(sales));
        Assert.Equal(20m, Reports.BiggestSale(sales));
    }
}
