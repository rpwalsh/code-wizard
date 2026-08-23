// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public enum Lifetime
{
    Singleton,
    Scoped,
    Transient,
}

public sealed class OptionsValidationException : Exception
{
    public IReadOnlyList<string> Problems { get; }

    public OptionsValidationException(IReadOnlyList<string> problems)
        : base(string.Join("; ", problems))
    {
        Problems = problems;
    }
}

public sealed record MailOptions(string Host, int Port)
{
    public static MailOptions Validated(IReadOnlyDictionary<string, string> config)
    {
        // Everything checked, everything reported: one failed deploy with
        // two problems named beats two failed deploys with one each.
        var problems = new List<string>();

        var host = config.GetValueOrDefault("Mail:Host", "");
        if (string.IsNullOrWhiteSpace(host))
        {
            problems.Add("Mail:Host is required");
        }

        var port = 587;
        if (config.TryGetValue("Mail:Port", out var rawPort))
        {
            if (!int.TryParse(rawPort, out port) || port < 1 || port > 65535)
            {
                problems.Add($"Mail:Port is invalid: {rawPort}");
                port = 587;
            }
        }

        if (problems.Count > 0)
        {
            throw new OptionsValidationException(problems);
        }
        return new MailOptions(host, port);
    }
}

internal sealed record Registration(
    Lifetime Lifetime,
    Func<object> Factory,
    IReadOnlyList<string> DependsOn);

public class ServiceRegistry
{
    private readonly Dictionary<string, Registration> _registrations = new();
    internal readonly Dictionary<string, object> SingletonCache = new();

    public void Register(
        string name,
        Lifetime lifetime,
        Func<object> factory,
        IReadOnlyList<string>? dependsOn = null)
    {
        var dependencies = dependsOn ?? Array.Empty<string>();

        // The captive check: a singleton outlives every scope, so a scoped
        // dependency inside one becomes an accidental singleton — one
        // request's DbContext shared by all requests forever.
        if (lifetime == Lifetime.Singleton)
        {
            foreach (var dependency in dependencies)
            {
                if (_registrations.TryGetValue(dependency, out var found) &&
                    found.Lifetime == Lifetime.Scoped)
                {
                    throw new InvalidOperationException(
                        $"singleton {name} cannot depend on scoped {dependency}");
                }
            }
        }

        _registrations[name] = new Registration(lifetime, factory, dependencies);
    }

    public Scope CreateScope() => new(this, _registrations);
}

public class Scope : IDisposable
{
    private readonly ServiceRegistry _registry;
    private readonly Dictionary<string, Registration> _registrations;
    private readonly Dictionary<string, object> _scopedCache = new();
    private readonly List<IDisposable> _owned = new();
    private bool _disposed;

    internal Scope(ServiceRegistry registry, Dictionary<string, Registration> registrations)
    {
        _registry = registry;
        _registrations = registrations;
    }

    public object Resolve(string name)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        if (!_registrations.TryGetValue(name, out var registration))
        {
            throw new KeyNotFoundException($"no service registered as {name}");
        }

        switch (registration.Lifetime)
        {
            case Lifetime.Singleton:
                // Cached in the registry: whichever scope asks first builds
                // it, and every later scope shares it.
                if (!_registry.SingletonCache.TryGetValue(name, out var single))
                {
                    single = registration.Factory();
                    _registry.SingletonCache[name] = single;
                }
                return single;

            case Lifetime.Scoped:
                if (!_scopedCache.TryGetValue(name, out var scoped))
                {
                    scoped = registration.Factory();
                    _scopedCache[name] = scoped;
                    // Disposal ownership follows the cache that created it.
                    if (scoped is IDisposable disposable)
                    {
                        _owned.Add(disposable);
                    }
                }
                return scoped;

            default:
                return registration.Factory();
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }
        _disposed = true;
        foreach (var owned in _owned)
        {
            owned.Dispose();
        }
    }
}
