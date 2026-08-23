// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

/// <summary>Wraps a sequence and counts how often it has been enumerated.</summary>
public sealed class CountingSource<T> : IEnumerable<T>
{
    private readonly IEnumerable<T> _items;

    public CountingSource(IEnumerable<T> items) => _items = items;

    public int Enumerations { get; private set; }

    public IEnumerator<T> GetEnumerator() => throw new NotImplementedException();

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() =>
        GetEnumerator();
}

public static class Queries
{
    public static IEnumerable<int> Expensive(IEnumerable<int> numbers) =>
        throw new NotImplementedException();

    public static (int Sum, int Count) SumTwice(IEnumerable<int> numbers) =>
        throw new NotImplementedException();

    public static IReadOnlyList<int> Snapshot(IEnumerable<int> numbers) =>
        throw new NotImplementedException();
}
