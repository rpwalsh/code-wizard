// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class ReportTests
{
    static Sale[] Sales => new[]
    {
        new Sale("north", "widget", 2, 10m),
        new Sale("north", "gadget", 1, 50m),
        new Sale("south", "widget", 5, 10m),
        new Sale("south", "widget", 1, 10m),
        new Sale("south", "sprocket", 2, 30m),
    };

    [RetrainerTest("revenue multiplies quantity by price", Concept = "csharp.linq.queries")]
    public void Revenue()
    {
        Assert.Equal(190m, Reports.Revenue(Sales));
    }

    [RetrainerTest("revenue is grouped by region", Concept = "csharp.linq.queries")]
    public void ByRegion()
    {
        var byRegion = Reports.RevenueByRegion(Sales);
        Assert.Equal(70m, byRegion["north"]);
        Assert.Equal(120m, byRegion["south"]);
        Assert.Equal(2, byRegion.Count);
    }

    [RetrainerTest("top products are ranked by revenue", Concept = "csharp.linq.queries")]
    public void Top()
    {
        // widget 20 + 50 + 10 = 80, gadget 50, sprocket 60.
        Assert.Sequence(new[] { "widget", "sprocket" }, Reports.TopProducts(Sales, 2));
    }

    [RetrainerTest("spread counts distinct products per region", Concept = "csharp.linq.queries")]
    public void Spread()
    {
        var spread = Reports.ProductSpread(Sales);
        Assert.Equal(2, spread.Count);
        Assert.Equal("north", spread[0].Region);
        Assert.Equal(2, spread[0].Distinct);
        // south sold widget twice and sprocket once: two distinct products.
        Assert.Equal(2, spread[1].Distinct);
    }

    [RetrainerTest("the biggest single sale is found", Concept = "csharp.linq.queries")]
    public void Biggest()
    {
        Assert.Equal(60m, Reports.BiggestSale(Sales));
    }
}
