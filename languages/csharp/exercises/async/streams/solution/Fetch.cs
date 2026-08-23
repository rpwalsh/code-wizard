// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public static class Fetch
{
    public static async Task<int> TotalSequentialAsync(IReadOnlyList<Func<Task<int>>> sources)
    {
        // The await inside the loop is the dependency claim: source N+1
        // does not start until source N has finished.
        var total = 0;
        foreach (var source in sources)
        {
            total += await source();
        }
        return total;
    }

    public static async Task<int> TotalParallelAsync(IReadOnlyList<Func<Task<int>>> sources)
    {
        // All the starting happens before any awaiting — that ordering is
        // the entire difference between this method and the one above.
        var tasks = sources.Select(source => source()).ToList();
        var results = await Task.WhenAll(tasks);
        return results.Sum();
    }

    public static async IAsyncEnumerable<int> RunningTotalsAsync(IAsyncEnumerable<int> values)
    {
        var total = 0;
        await foreach (var value in values)
        {
            total += value;
            yield return total;
        }
    }

    public static async Task<List<int>> CollectAsync(IAsyncEnumerable<int> values, int limit)
    {
        var collected = new List<int>();
        if (limit <= 0)
        {
            return collected;
        }
        await foreach (var value in values)
        {
            collected.Add(value);
            // Breaking disposes the producer — early termination is part
            // of the async stream contract, not an abuse of it.
            if (collected.Count >= limit)
            {
                break;
            }
        }
        return collected;
    }

    public static Task<int> NeverBlockAsync(Func<Task<int>> source)
    {
        // Async all the way: nothing here parks a thread to wait for a
        // continuation that may need that very thread to run.
        return DoubleAsync(source);

        static async Task<int> DoubleAsync(Func<Task<int>> inner)
        {
            var value = await inner();
            return value * 2;
        }
    }
}
