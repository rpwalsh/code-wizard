// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("two counters are two identities", Concept = "csharp.values.types")]
    public void SeparateIdentities()
    {
        var first = new Counter();
        var second = new Counter();
        Values.Bump(first);
        Assert.Equal(0, second.Count);
    }

    [RetrainerTest("assigning a struct is already a copy", Concept = "csharp.values.structs")]
    public void AssignmentCopies()
    {
        var a = new Point(1, 1);
        var b = a;
        b = Values.Move(b, 9, 9);
        Assert.Equal(new Point(1, 1), a);
        Assert.Equal(new Point(10, 10), b);
    }

    [RetrainerTest("no points is zero distance", Concept = "csharp.values.structs")]
    public void EmptySum()
    {
        Assert.Equal(0, Values.SumDistances(Array.Empty<Point>()));
    }

    [RetrainerTest("negative coordinates use absolute distance", Concept = "csharp.values.structs")]
    public void NegativeDistance()
    {
        Assert.Equal(7, Values.SumDistances(new[] { new Point(-3, -4) }));
    }
}
