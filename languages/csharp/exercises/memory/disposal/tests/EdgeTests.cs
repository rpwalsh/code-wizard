// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("a throwing body still releases the lease", Concept = "csharp.memory.disposal")]
    public void ReleasesOnThrow()
    {
        var released = new List<string>();

        Assert.Throws<InvalidOperationException>(() =>
            Resources.WithLease("file", released.Add, _ => throw new InvalidOperationException("boom")));

        // The exception escaped AND the cleanup ran — the try/finally
        // inside using doing exactly its job.
        Assert.Sequence(new[] { "file" }, released);
    }

    [RetrainerTest("use after dispose is refused by name", Concept = "csharp.memory.disposal")]
    public void UseAfterDispose()
    {
        var lease = new Lease("gone", _ => { });
        lease.Dispose();
        Assert.Throws<ObjectDisposedException>(() => lease.Use());
    }

    [RetrainerTest("an empty line sums to zero", Concept = "csharp.memory.spans")]
    public void EmptyCsv()
    {
        Assert.Equal(0, Resources.SumCsv(ReadOnlySpan<char>.Empty));
    }

    [RetrainerTest("whitespace around numbers is tolerated", Concept = "csharp.memory.spans")]
    public void WhitespaceTolerated()
    {
        Assert.Equal(30, Resources.SumCsv(" 10 , 20 "));
    }

    [RetrainerTest("negative numbers are numbers", Concept = "csharp.memory.spans")]
    public void Negatives()
    {
        Assert.Equal(-5, Resources.SumCsv("10,-15"));
    }

    [RetrainerTest("a malformed field throws Parse's own error", Concept = "csharp.errors.exceptions")]
    public void MalformedField()
    {
        Assert.Throws<FormatException>(() => Resources.SumCsv("10,twenty".AsSpan()));
    }

    [RetrainerTest("an unparsable head reports false", Concept = "csharp.memory.spans")]
    public void BadHead()
    {
        Assert.False(Resources.TryFirstField("abc,1", out _), "letters do not parse");
        Assert.False(Resources.TryFirstField(ReadOnlySpan<char>.Empty, out _), "nothing to parse");
    }
}
