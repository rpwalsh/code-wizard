// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public abstract record AuthResult
{
    public sealed record AnonymousResult : AuthResult;
    public sealed record InvalidResult(string Reason) : AuthResult;
    public sealed record AuthenticatedResult(string User) : AuthResult;

    public static AuthResult Anonymous() => new AnonymousResult();
    public static AuthResult Invalid(string reason) => new InvalidResult(reason);
    public static AuthResult Authenticated(string user) => new AuthenticatedResult(user);
}

public sealed record Problem(int Status, string Detail, string TraceId);

public class LogScope
{
    public IDisposable Push(string key, string value)
    {
        throw new NotImplementedException();
    }

    public string Line(string message)
    {
        throw new NotImplementedException();
    }
}

public static class Boundary
{
    public static AuthResult Authenticate(
        string? header,
        IReadOnlyDictionary<string, string> tokens)
    {
        throw new NotImplementedException();
    }

    public static string AggregateHealth(IReadOnlyDictionary<string, string> checks)
    {
        throw new NotImplementedException();
    }

    public static Problem ToProblem(Exception error, string traceId)
    {
        throw new NotImplementedException();
    }
}
