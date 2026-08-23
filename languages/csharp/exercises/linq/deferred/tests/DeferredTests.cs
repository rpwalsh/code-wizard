// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class DeferredTests
{
    [RetrainerTest("building a query enumerates nothing", Concept = "csharp.linq.deferred")]
    public void Deferred()
    {
        var source = new CountingSource<int>(new[] { 1, -2, 3 });
        _ = Queries.Expensive(source);
        Assert.Equal(0, source.Enumerations);
    }

    [RetrainerTest("the query runs when it is read", Concept = "csharp.linq.deferred")]
    public void RunsOnRead()
    {
        var source = new CountingSource<int>(new[] { 1, -2, 3 });
        var result = Queries.Expensive(source).ToList();
        Assert.Sequence(new[] { 1, 3 }, result);
        Assert.Equal(1, source.Enumerations);
    }

    [RetrainerTest("sum and count come from one pass", Concept = "csharp.linq.performance")]
    public void OnePass()
    {
        var source = new CountingSource<int>(new[] { 1, 2, 3 });
        var (sum, count) = Queries.SumTwice(source);

        Assert.Equal(6, sum);
        Assert.Equal(3, count);
        // The point of the exercise: the obvious implementation reads 2 here.
        Assert.Equal(1, source.Enumerations);
    }

    [RetrainerTest("a snapshot is taken now", Concept = "csharp.linq.queries")]
    public void Snapshot()
    {
        var live = new List<int> { 1, 2 };
        var taken = Queries.Snapshot(live);
        live.Add(3);
        Assert.Equal(2, taken.Count);
    }
}
