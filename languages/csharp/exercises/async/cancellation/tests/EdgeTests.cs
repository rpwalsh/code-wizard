// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("cancellation is not failure", Concept = "csharp.errors.results")]
    public void CancellationIsDistinct()
    {
        using var source = new CancellationTokenSource();
        source.Cancel();

        var outcome = Work.TryRunAsync(
            token => Work.SumAsync(new[] { 1, 2, 3 }, token),
            source.Token).Result;

        // The whole point: a caller pressing Cancel must not surface as an
        // error, or every deployment produces alert noise.
        Assert.Equal(Outcome.Canceled(), outcome);
    }

    [RetrainerTest("a real failure reports its message", Concept = "csharp.errors.results")]
    public void Failure()
    {
        var outcome = Work.TryRunAsync(
            _ => throw new InvalidOperationException("nope"),
            CancellationToken.None).Result;

        Assert.Equal(Outcome.Failed("nope"), outcome);
    }

    [RetrainerTest("cancellation part-way through is honored", Concept = "csharp.async.cancellation")]
    public void MidSequence()
    {
        using var source = new CancellationTokenSource();

        // Cancels once the third item has been seen, so a check that only
        // runs before the loop would miss it entirely.
        IEnumerable<int> Numbers()
        {
            for (var index = 0; index < 10; index++)
            {
                if (index == 3) source.Cancel();
                yield return index;
            }
        }

        var outcome = Work.TryRunAsync(token => Work.SumAsync(Numbers(), token), source.Token).Result;
        Assert.Equal(Outcome.Canceled(), outcome);
    }
}
