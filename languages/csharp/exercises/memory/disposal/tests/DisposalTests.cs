// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class DisposalTests
{
    [RetrainerTest("using releases the lease on the way out", Concept = "csharp.memory.disposal")]
    public void ReleasesOnReturn()
    {
        var released = new List<string>();
        var result = Resources.WithLease("db", released.Add, lease => lease.Use());

        Assert.Equal("using db", result);
        Assert.Sequence(new[] { "db" }, released);
    }

    [RetrainerTest("dispose is exactly once", Concept = "csharp.memory.disposal")]
    public void DisposeOnce()
    {
        var count = 0;
        var lease = new Lease("x", _ => count += 1);
        lease.Dispose();
        lease.Dispose();
        lease.Dispose();
        Assert.Equal(1, count);
    }

    [RetrainerTest("csv sums through span slices", Concept = "csharp.memory.spans")]
    public void SumsCsv()
    {
        Assert.Equal(60, Resources.SumCsv("10,20,30"));
        Assert.Equal(5, Resources.SumCsv("5"));
    }

    [RetrainerTest("try-first reads the head", Concept = "csharp.memory.spans")]
    public void FirstField()
    {
        Assert.True(Resources.TryFirstField("42,99", out var value), "the head should parse");
        Assert.Equal(42, value);
    }
}
