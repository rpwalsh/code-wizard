// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class LifetimeTests
{
    private sealed class Probe
    {
        public static int Built;
        public Probe() { Built += 1; }
    }

    [RetrainerTest("a singleton is one instance across scopes", Concept = "aspnet.di.lifetimes")]
    public void SingletonShares()
    {
        var registry = new ServiceRegistry();
        registry.Register("clock", Lifetime.Singleton, () => new object());

        using var first = registry.CreateScope();
        using var second = registry.CreateScope();
        Assert.True(ReferenceEquals(first.Resolve("clock"), second.Resolve("clock")),
            "both scopes see the same instance");
    }

    [RetrainerTest("a scoped service is one per scope", Concept = "aspnet.di.lifetimes")]
    public void ScopedPerScope()
    {
        var registry = new ServiceRegistry();
        registry.Register("db", Lifetime.Scoped, () => new object());

        using var first = registry.CreateScope();
        using var second = registry.CreateScope();

        Assert.True(ReferenceEquals(first.Resolve("db"), first.Resolve("db")),
            "within a scope, shared");
        Assert.False(ReferenceEquals(first.Resolve("db"), second.Resolve("db")),
            "across scopes, fresh");
    }

    [RetrainerTest("a transient is new every time", Concept = "aspnet.di.lifetimes")]
    public void TransientAlwaysNew()
    {
        var registry = new ServiceRegistry();
        registry.Register("uuid", Lifetime.Transient, () => new object());

        using var scope = registry.CreateScope();
        Assert.False(ReferenceEquals(scope.Resolve("uuid"), scope.Resolve("uuid")),
            "every resolve constructs");
    }

    [RetrainerTest("good options validate through", Concept = "aspnet.di.options")]
    public void OptionsHappyPath()
    {
        var options = MailOptions.Validated(new Dictionary<string, string>
        {
            ["Mail:Host"] = "smtp.example.com",
            ["Mail:Port"] = "2525",
        });
        Assert.Equal(new MailOptions("smtp.example.com", 2525), options);
    }

    [RetrainerTest("the port defaults when absent", Concept = "aspnet.di.options")]
    public void PortDefaults()
    {
        var options = MailOptions.Validated(new Dictionary<string, string>
        {
            ["Mail:Host"] = "smtp.example.com",
        });
        Assert.Equal(587, options.Port);
    }
}
