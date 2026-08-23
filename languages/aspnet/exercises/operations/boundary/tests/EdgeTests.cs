// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    private static readonly Dictionary<string, string> Tokens = new()
    {
        ["t0ken"] = "ada",
    };

    [RetrainerTest("malformed headers are invalid, not anonymous", Concept = "aspnet.security.authn")]
    public void MalformedHeaders()
    {
        // Silently downgrading a broken header to anonymous hides real
        // breakage: the bug report says "it forgot me".
        Assert.Equal(AuthResult.Invalid("malformed header"),
            Boundary.Authenticate("bearer t0ken", Tokens));
        Assert.Equal(AuthResult.Invalid("malformed header"),
            Boundary.Authenticate("Bearer", Tokens));
        Assert.Equal(AuthResult.Invalid("malformed header"),
            Boundary.Authenticate("Bearer ", Tokens));
        Assert.Equal(AuthResult.Invalid("malformed header"),
            Boundary.Authenticate("Bearer two tokens", Tokens));
    }

    [RetrainerTest("an unknown token is its own refusal", Concept = "aspnet.security.authn")]
    public void UnknownToken()
    {
        Assert.Equal(AuthResult.Invalid("unknown token"),
            Boundary.Authenticate("Bearer expired", Tokens));
    }

    [RetrainerTest("disposing a scope twice pops once", Concept = "aspnet.operations.logging")]
    public void DoubleDispose()
    {
        var scope = new LogScope();
        var handle = scope.Push("k", "v");
        handle.Dispose();
        handle.Dispose();
        Assert.Equal("clean", scope.Line("clean"));
    }

    [RetrainerTest("no checks means healthy", Concept = "aspnet.operations.health")]
    public void EmptyHealth()
    {
        Assert.Equal("healthy", Boundary.AggregateHealth(new Dictionary<string, string>()));
    }

    [RetrainerTest("unexpected exceptions stay opaque but traceable", Concept = "aspnet.operations.errors")]
    public void OpaqueButTraceable()
    {
        var problem = Boundary.ToProblem(
            new InvalidOperationException("connection string: Server=10.0.0.5;Password=hunter2"),
            "t-99");

        Assert.Equal(500, problem.Status);
        Assert.Equal("internal error", problem.Detail);
        Assert.False(problem.Detail.Contains("hunter2"), "internals never reach the response");
        // The id is what makes the ticket and the log findable from each
        // other — the testing seam for the whole boundary.
        Assert.Equal("t-99", problem.TraceId);
    }
}
