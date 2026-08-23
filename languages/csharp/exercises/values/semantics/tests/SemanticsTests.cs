// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class SemanticsTests
{
    [RetrainerTest("moving a point leaves the original where it was", Concept = "csharp.values.structs")]
    public void MoveCopies()
    {
        var original = new Point(2, 3);
        var moved = Values.Move(original, 5, 5);

        Assert.Equal(new Point(7, 8), moved);
        Assert.Equal(new Point(2, 3), original);
    }

    [RetrainerTest("bumping a counter is visible to the caller", Concept = "csharp.values.types")]
    public void BumpShares()
    {
        var counter = new Counter();
        Values.Bump(counter);
        Values.Bump(counter);
        Assert.Equal(2, counter.Count);
    }

    [RetrainerTest("points compare by value", Concept = "csharp.values.structs")]
    public void ValueEquality()
    {
        Assert.Equal(new Point(1, 2), new Point(1, 2));
        Assert.True(new Point(1, 2) != new Point(2, 1), "different coordinates differ");
    }

    [RetrainerTest("move-both returns the copy and the untouched start", Concept = "csharp.values.types")]
    public void MoveBoth()
    {
        var (moved, original) = Values.MoveBoth(new Point(0, 0));
        Assert.Equal(new Point(1, 1), moved);
        Assert.Equal(new Point(0, 0), original);
    }

    [RetrainerTest("distances sum over the list", Concept = "csharp.values.structs")]
    public void Distances()
    {
        var points = new[] { new Point(1, 2), new Point(-3, 4) };
        Assert.Equal(10, Values.SumDistances(points));
    }
}
