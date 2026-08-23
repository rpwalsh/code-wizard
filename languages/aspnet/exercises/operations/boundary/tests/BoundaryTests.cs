// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class BoundaryTests
{
    private static readonly Dictionary<string, string> Tokens = new()
    {
        ["t0ken"] = "ada",
    };

    [RetrainerTest("a good bearer token authenticates", Concept = "aspnet.security.authn")]
    public void GoodToken()
    {
        var result = Boundary.Authenticate("Bearer t0ken", Tokens);
        Assert.Equal(AuthResult.Authenticated("ada"), result);
    }

    [RetrainerTest("no header is anonymous, not an error", Concept = "aspnet.security.authn")]
    public void NoHeader()
    {
        Assert.Equal(AuthResult.Anonymous(), Boundary.Authenticate(null, Tokens));
    }

    [RetrainerTest("scoped fields ride along with the line", Concept = "aspnet.operations.logging")]
    public void ScopedFields()
    {
        var scope = new LogScope();
        using (scope.Push("requestId", "r-42"))
        {
            Assert.Equal("started requestId=r-42", scope.Line("started"));
            using (scope.Push("user", "ada"))
            {
                Assert.Equal("loaded requestId=r-42 user=ada", scope.Line("loaded"));
            }
            Assert.Equal("done requestId=r-42", scope.Line("done"));
        }
        Assert.Equal("after", scope.Line("after"));
    }

    [RetrainerTest("health aggregates to the worst", Concept = "aspnet.operations.health")]
    public void HealthWorstWins()
    {
        Assert.Equal("healthy", Boundary.AggregateHealth(new Dictionary<string, string>
        {
            ["db"] = "healthy",
            ["cache"] = "healthy",
        }));
        Assert.Equal("degraded", Boundary.AggregateHealth(new Dictionary<string, string>
        {
            ["db"] = "healthy",
            ["cache"] = "degraded",
        }));
        Assert.Equal("unhealthy", Boundary.AggregateHealth(new Dictionary<string, string>
        {
            ["db"] = "unhealthy",
            ["cache"] = "degraded",
        }));
    }

    [RetrainerTest("known exceptions map to their statuses", Concept = "aspnet.operations.errors")]
    public void KnownMappings()
    {
        Assert.Equal(new Problem(404, "no such order", "t-1"),
            Boundary.ToProblem(new KeyNotFoundException("no such order"), "t-1"));
        Assert.Equal(400, Boundary.ToProblem(new ArgumentException("bad page"), "t-2").Status);
    }
}
