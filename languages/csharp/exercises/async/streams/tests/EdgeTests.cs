// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    private static async IAsyncEnumerable<int> Endless()
    {
        var n = 0;
        while (true)
        {
            await Task.Yield();
            yield return n++;
        }
    }

    [RetrainerTest("collect stops early instead of draining", Concept = "csharp.async.streams")]
    public void CollectStops()
    {
        // An endless stream: only early termination can finish this test.
        var taken = Fetch.CollectAsync(Endless(), 4).GetAwaiter().GetResult();
        Assert.Sequence(new[] { 0, 1, 2, 3 }, taken);
    }

    [RetrainerTest("collect of zero takes nothing", Concept = "csharp.async.streams")]
    public void CollectZero()
    {
        Assert.Equal(0, Fetch.CollectAsync(Endless(), 0).GetAwaiter().GetResult().Count);
    }

    [RetrainerTest("empty source lists sum to zero", Concept = "csharp.async.await")]
    public void EmptySources()
    {
        var none = Array.Empty<Func<Task<int>>>();
        Assert.Equal(0, Fetch.TotalSequentialAsync(none).GetAwaiter().GetResult());
        Assert.Equal(0, Fetch.TotalParallelAsync(none).GetAwaiter().GetResult());
    }

    [RetrainerTest("sequential really is one at a time", Concept = "csharp.async.await")]
    public void SequentialDoesNotOverlap()
    {
        var running = 0;
        var peak = 0;

        Func<Task<int>> Tracked() => async () =>
        {
            var now = Interlocked.Increment(ref running);
            peak = Math.Max(peak, now);
            await Task.Delay(2);
            Interlocked.Decrement(ref running);
            return 1;
        };

        Fetch.TotalSequentialAsync(new[] { Tracked(), Tracked(), Tracked() })
            .GetAwaiter()
            .GetResult();
        Assert.Equal(1, peak);
    }

    [RetrainerTest("the learner's code contains no blocking waits", Concept = "csharp.async.deadlock")]
    public void NoBlockingSpellings()
    {
        // The deadlock needs a single-threaded context to demonstrate, so
        // the honest check is the ingredient ban itself.
        var source = File.ReadAllText("Fetch.cs");
        Assert.False(source.Contains(".Result"), "no .Result in async code");
        Assert.False(source.Contains(".Wait()"), "no .Wait() in async code");
        Assert.False(source.Contains("GetAwaiter().GetResult()"), "no sync-over-async");
    }
}
