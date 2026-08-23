// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public static class Fetch
{
    public static async Task<int> TotalSequentialAsync(IReadOnlyList<Func<Task<int>>> sources)
    {
        throw new NotImplementedException();
    }

    public static async Task<int> TotalParallelAsync(IReadOnlyList<Func<Task<int>>> sources)
    {
        throw new NotImplementedException();
    }

    public static async IAsyncEnumerable<int> RunningTotalsAsync(IAsyncEnumerable<int> values)
    {
        await Task.CompletedTask;
        yield break;
    }

    public static async Task<List<int>> CollectAsync(IAsyncEnumerable<int> values, int limit)
    {
        throw new NotImplementedException();
    }

    public static Task<int> NeverBlockAsync(Func<Task<int>> source)
    {
        throw new NotImplementedException();
    }
}
