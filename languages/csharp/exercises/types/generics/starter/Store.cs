// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public interface IEntity
{
    string Id { get; }
}

public record Document(string Id, int Version) : IEntity, IComparable<Document>
{
    public int CompareTo(Document? other)
    {
        throw new NotImplementedException();
    }
}

public class MemoryStore<T> where T : IEntity
{
    public int Count => throw new NotImplementedException();

    public void Save(T entity)
    {
        throw new NotImplementedException();
    }

    public T Get(string id)
    {
        throw new NotImplementedException();
    }

    public bool TryGet(string id, out T entity)
    {
        throw new NotImplementedException();
    }
}

public static class Repository
{
    public static T Newest<T>(IEnumerable<T> items) where T : IEntity, IComparable<T>
    {
        throw new NotImplementedException();
    }

    public static Dictionary<string, T> ById<T>(IEnumerable<T> items) where T : IEntity
    {
        throw new NotImplementedException();
    }
}
