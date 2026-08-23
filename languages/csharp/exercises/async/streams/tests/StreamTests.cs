// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class StreamTests
{
    private static Func<Task<int>> Delayed(int value, int ms = 5) =>
        async () =>
        {
            await Task.Delay(ms);
            return value;
        };

    private static async IAsyncEnumerable<int> Stream(params int[] values)
    {
        foreach (var value in values)
        {
            await Task.Yield();
            yield return value;
        }
    }

    [RetrainerTest("sequential total sums in order", Concept = "csharp.async.await")]
    public void Sequential()
    {
        var sources = new[] { Delayed(1), Delayed(2), Delayed(3) };
        Assert.Equal(6, Fetch.TotalSequentialAsync(sources).GetAwaiter().GetResult());
    }

    [RetrainerTest("parallel total starts everything before awaiting", Concept = "csharp.async.await")]
    public void ParallelOverlaps()
    {
        var started = 0;
        var release = new TaskCompletionSource();

        Func<Task<int>> Gated(int value) => async () =>
        {
            Interlocked.Increment(ref started);
            await release.Task;
            return value;
        };

        var task = Fetch.TotalParallelAsync(new[] { Gated(1), Gated(2), Gated(3) });
        // All three began before any finished — the overlap, counted
        // rather than timed, so this cannot flake.
        Assert.Equal(3, started);
        release.SetResult();
        Assert.Equal(6, task.GetAwaiter().GetResult());
    }

    [RetrainerTest("running totals accumulate through the stream", Concept = "csharp.async.streams")]
    public void RunningTotals()
    {
        var totals = Fetch.CollectAsync(Fetch.RunningTotalsAsync(Stream(1, 2, 3, 4)), 10)
            .GetAwaiter()
            .GetResult();
        Assert.Sequence(new[] { 1, 3, 6, 10 }, totals);
    }

    [RetrainerTest("never-block doubles through a continuation", Concept = "csharp.async.deadlock")]
    public void NeverBlockDoubles()
    {
        Assert.Equal(14, Fetch.NeverBlockAsync(Delayed(7)).GetAwaiter().GetResult());
    }
}
