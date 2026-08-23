// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

/// <summary>Wraps a sequence and counts how often it has been enumerated.</summary>
public sealed class CountingSource<T> : IEnumerable<T>
{
    private readonly IEnumerable<T> _items;

    public CountingSource(IEnumerable<T> items) => _items = items;

    public int Enumerations { get; private set; }

    /// <remarks>
    /// The count rises here rather than in the constructor: this is the moment
    /// enumeration actually begins, and the whole point of the exercise is
    /// that building a query is not that moment.
    /// </remarks>
    public IEnumerator<T> GetEnumerator()
    {
        Enumerations++;
        return _items.GetEnumerator();
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() =>
        GetEnumerator();
}

public static class Queries
{
    /// <summary>Builds a query and runs none of it.</summary>
    public static IEnumerable<int> Expensive(IEnumerable<int> numbers) =>
        numbers.Where(n => n > 0);

    /// <summary>
    /// One pass, deliberately.
    /// </summary>
    /// <remarks>
    /// `numbers.Sum()` followed by `numbers.Count()` is the obvious version and
    /// walks the source twice — a wasted pass over a list, two round trips over
    /// a database, and zero over a sequence that can only be read once.
    /// </remarks>
    public static (int Sum, int Count) SumTwice(IEnumerable<int> numbers)
    {
        var sum = 0;
        var count = 0;
        foreach (var number in numbers)
        {
            sum += number;
            count++;
        }
        return (sum, count);
    }

    /// <summary>Runs the query now, so later changes to the source do not show.</summary>
    public static IReadOnlyList<int> Snapshot(IEnumerable<int> numbers) => numbers.ToList();
}
