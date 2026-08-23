// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("an empty sequence sums to zero", Concept = "csharp.linq.performance")]
    public void Empty()
    {
        var (sum, count) = Queries.SumTwice(Array.Empty<int>());
        Assert.Equal(0, sum);
        Assert.Equal(0, count);
    }

    [RetrainerTest("a live query sees later changes", Concept = "csharp.linq.deferred")]
    public void StaysLive()
    {
        // The other half of deferred execution: not a cost, a feature — and
        // the reason a query held across a change is sometimes a surprise.
        var live = new List<int> { 1 };
        var query = Queries.Expensive(live);
        live.Add(5);
        Assert.Sequence(new[] { 1, 5 }, query.ToList());
    }

    [RetrainerTest("negatives and zero are filtered out", Concept = "csharp.linq.queries")]
    public void Filters()
    {
        Assert.Sequence(new[] { 2 }, Queries.Expensive(new[] { -1, 0, 2 }).ToList());
    }

    [RetrainerTest("reading a query twice enumerates twice", Concept = "csharp.linq.performance")]
    public void TwiceIsTwice()
    {
        var source = new CountingSource<int>(new[] { 1, 2 });
        var query = Queries.Expensive(source);
        _ = query.ToList();
        _ = query.ToList();
        Assert.Equal(2, source.Enumerations);
    }
}
