// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class StoreTests
{
    [RetrainerTest("saved entities come back by id", Concept = "csharp.types.interfaces")]
    public void SaveAndGet()
    {
        var store = new MemoryStore<Document>();
        store.Save(new Document("a", 1));
        store.Save(new Document("b", 2));

        Assert.Equal(new Document("a", 1), store.Get("a"));
        Assert.Equal(2, store.Count);
    }

    [RetrainerTest("saving again replaces", Concept = "csharp.types.interfaces")]
    public void SaveReplaces()
    {
        var store = new MemoryStore<Document>();
        store.Save(new Document("a", 1));
        store.Save(new Document("a", 9));

        Assert.Equal(9, store.Get("a").Version);
        Assert.Equal(1, store.Count);
    }

    [RetrainerTest("try-get is the quiet twin", Concept = "csharp.types.interfaces")]
    public void TryGet()
    {
        var store = new MemoryStore<Document>();
        store.Save(new Document("a", 1));

        Assert.True(store.TryGet("a", out var found), "present id should be found");
        Assert.Equal(1, found.Version);
        Assert.False(store.TryGet("zz", out _), "absent id reports false, never throws");
    }

    [RetrainerTest("newest ranks by CompareTo", Concept = "csharp.types.generics")]
    public void Newest()
    {
        var docs = new[] { new Document("a", 3), new Document("b", 9), new Document("c", 5) };
        Assert.Equal("b", Repository.Newest(docs).Id);
    }

    [RetrainerTest("by-id keys the collection", Concept = "csharp.types.generics")]
    public void ById()
    {
        var keyed = Repository.ById(new[] { new Document("x", 1), new Document("y", 2) });
        Assert.Equal(2, keyed.Count);
        Assert.Equal(2, keyed["y"].Version);
    }
}
