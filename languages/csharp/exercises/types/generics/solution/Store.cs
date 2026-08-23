// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

// One member: exactly what the store consumes. Small interfaces compose;
// fat ones conscript.
public interface IEntity
{
    string Id { get; }
}

public record Document(string Id, int Version) : IEntity, IComparable<Document>
{
    public int CompareTo(Document? other) => other is null ? 1 : Version.CompareTo(other.Version);
}

public class MemoryStore<T> where T : IEntity
{
    private readonly Dictionary<string, T> _items = new();

    public int Count => _items.Count;

    public void Save(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);
        if (string.IsNullOrEmpty(entity.Id))
        {
            throw new ArgumentException("entity Id must not be empty", nameof(entity));
        }
        _items[entity.Id] = entity;
    }

    public T Get(string id)
    {
        if (_items.TryGetValue(id, out var found))
        {
            return found;
        }
        // The BCL's own vocabulary for a miss, with the id in the message.
        throw new KeyNotFoundException($"no entity with id: {id}");
    }

    public bool TryGet(string id, out T entity)
    {
        return _items.TryGetValue(id, out entity!);
    }
}

public static class Repository
{
    // The constraints are the body's needs, spelled out: compare to rank,
    // Id to exist in the store's world. Nothing more.
    public static T Newest<T>(IEnumerable<T> items) where T : IEntity, IComparable<T>
    {
        using var walker = items.GetEnumerator();
        if (!walker.MoveNext())
        {
            throw new InvalidOperationException("no items");
        }

        var best = walker.Current;
        while (walker.MoveNext())
        {
            if (best.CompareTo(walker.Current) < 0)
            {
                best = walker.Current;
            }
        }
        return best;
    }

    public static Dictionary<string, T> ById<T>(IEnumerable<T> items) where T : IEntity
    {
        var keyed = new Dictionary<string, T>();
        foreach (var item in items)
        {
            if (!keyed.TryAdd(item.Id, item))
            {
                throw new ArgumentException($"duplicate id: {item.Id}", nameof(items));
            }
        }
        return keyed;
    }
}
