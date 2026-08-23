// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    private sealed class TrackedDisposable : IDisposable
    {
        public bool Disposed;
        public void Dispose() => Disposed = true;
    }

    [RetrainerTest("a captive dependency is refused with both names", Concept = "aspnet.di.lifetimes")]
    public void CaptiveRefused()
    {
        var registry = new ServiceRegistry();
        registry.Register("db", Lifetime.Scoped, () => new object());

        var error = Assert.Throws<InvalidOperationException>(() =>
            registry.Register("cache", Lifetime.Singleton, () => new object(),
                new[] { "db" }));
        Assert.True(error.Message.Contains("cache") && error.Message.Contains("db"),
            "the message names captor and captive");
    }

    [RetrainerTest("disposing a scope disposes its scoped services", Concept = "aspnet.data.context")]
    public void ScopeDisposesScoped()
    {
        var registry = new ServiceRegistry();
        registry.Register("db", Lifetime.Scoped, () => new TrackedDisposable());

        TrackedDisposable held;
        using (var scope = registry.CreateScope())
        {
            held = (TrackedDisposable)scope.Resolve("db");
            Assert.False(held.Disposed, "alive while the scope lives");
        }
        Assert.True(held.Disposed, "the request ends, the context goes with it");
    }

    [RetrainerTest("singletons survive scope disposal", Concept = "aspnet.data.context")]
    public void SingletonsSurvive()
    {
        var registry = new ServiceRegistry();
        registry.Register("keeper", Lifetime.Singleton, () => new TrackedDisposable());

        TrackedDisposable held;
        using (var scope = registry.CreateScope())
        {
            held = (TrackedDisposable)scope.Resolve("keeper");
        }
        Assert.False(held.Disposed, "the registry owns singletons, not the scope");
    }

    [RetrainerTest("bad options report every problem at once", Concept = "aspnet.di.options")]
    public void AllOptionProblems()
    {
        var error = Assert.Throws<OptionsValidationException>(() =>
            MailOptions.Validated(new Dictionary<string, string> { ["Mail:Port"] = "S25" }));
        Assert.Equal(2, error.Problems.Count);
    }

    [RetrainerTest("a resolve after dispose is refused", Concept = "aspnet.di.lifetimes")]
    public void ResolveAfterDispose()
    {
        var registry = new ServiceRegistry();
        registry.Register("x", Lifetime.Transient, () => new object());
        var scope = registry.CreateScope();
        scope.Dispose();
        Assert.Throws<ObjectDisposedException>(() => scope.Resolve("x"));
    }
}
