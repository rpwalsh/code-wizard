// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("a miss throws with the id in the message", Concept = "csharp.errors.exceptions")]
    public void MissNamesTheId()
    {
        var store = new MemoryStore<Document>();
        var error = Assert.Throws<KeyNotFoundException>(() => store.Get("ghost-42"));
        Assert.True(error.Message.Contains("ghost-42"), "the message should carry the id");
    }

    [RetrainerTest("null and empty ids are argument errors", Concept = "csharp.errors.exceptions")]
    public void BadArguments()
    {
        var store = new MemoryStore<Document>();
        Assert.Throws<ArgumentNullException>(() => store.Save(null!));
        var error = Assert.Throws<ArgumentException>(() => store.Save(new Document("", 1)));
        Assert.True(error.Message.Contains("Id"), "the message should mention Id");
    }

    [RetrainerTest("newest of nothing is an invalid operation", Concept = "csharp.errors.exceptions")]
    public void NewestOfNothing()
    {
        Assert.Throws<InvalidOperationException>(
            () => Repository.Newest(Array.Empty<Document>()));
    }

    [RetrainerTest("newest of one is itself", Concept = "csharp.types.generics")]
    public void NewestOfOne()
    {
        Assert.Equal("only", Repository.Newest(new[] { new Document("only", 1) }).Id);
    }

    [RetrainerTest("a duplicate id is refused by name", Concept = "csharp.errors.exceptions")]
    public void DuplicateId()
    {
        var docs = new[] { new Document("dup", 1), new Document("dup", 2) };
        var error = Assert.Throws<ArgumentException>(() => Repository.ById(docs));
        Assert.True(error.Message.Contains("dup"), "the message should name the id");
    }

    [RetrainerTest("a tie keeps the earlier element", Concept = "csharp.types.generics")]
    public void TieKeepsFirst()
    {
        var docs = new[] { new Document("first", 5), new Document("second", 5) };
        Assert.Equal("first", Repository.Newest(docs).Id);
    }
}
