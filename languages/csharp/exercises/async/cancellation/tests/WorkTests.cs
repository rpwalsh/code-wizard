// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class WorkTests
{
    [RetrainerTest("adds the numbers when nothing is canceled", Concept = "csharp.async.tasks")]
    public void Sums()
    {
        var total = Work.SumAsync(new[] { 1, 2, 3, 4 }, CancellationToken.None).Result;
        Assert.Equal(10, total);
    }

    [RetrainerTest("an empty sequence sums to zero", Concept = "csharp.async.tasks")]
    public void Empty()
    {
        Assert.Equal(0, Work.SumAsync(Array.Empty<int>(), CancellationToken.None).Result);
    }

    [RetrainerTest("a canceled token stops the sum", Concept = "csharp.async.cancellation")]
    public void Canceled()
    {
        using var source = new CancellationTokenSource();
        source.Cancel();
        Assert.Throws<OperationCanceledException>(
            () => _ = Work.SumAsync(new[] { 1, 2, 3 }, source.Token).GetAwaiter().GetResult());
    }

    [RetrainerTest("completed work reports its value", Concept = "csharp.errors.results")]
    public void Completes()
    {
        var outcome = Work.TryRunAsync(_ => Task.FromResult(7), CancellationToken.None).Result;
        Assert.Equal(Outcome.Completed(7), outcome);
    }
}
