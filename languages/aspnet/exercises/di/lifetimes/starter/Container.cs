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
        throw new NotImplementedException();
    }
}

public class ServiceRegistry
{
    public void Register(
        string name,
        Lifetime lifetime,
        Func<object> factory,
        IReadOnlyList<string>? dependsOn = null)
    {
        throw new NotImplementedException();
    }

    public Scope CreateScope()
    {
        throw new NotImplementedException();
    }
}

public class Scope : IDisposable
{
    public object Resolve(string name)
    {
        throw new NotImplementedException();
    }

    public void Dispose()
    {
        throw new NotImplementedException();
    }
}
