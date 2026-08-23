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
    private readonly List<(string Key, string Value)> _fields = new();

    private sealed class Popper : IDisposable
    {
        private readonly LogScope _scope;
        private readonly (string, string) _entry;
        private bool _done;

        public Popper(LogScope scope, (string, string) entry)
        {
            _scope = scope;
            _entry = entry;
        }

        public void Dispose()
        {
            if (_done)
            {
                return;
            }
            _done = true;
            _scope._fields.Remove(_entry);
        }
    }

    public IDisposable Push(string key, string value)
    {
        var entry = (key, value);
        _fields.Add(entry);
        return new Popper(this, entry);
    }

    public string Line(string message)
    {
        // The fields ride along with every line inside the scope — the
        // request id typed once, present everywhere.
        var suffix = string.Concat(_fields.Select(field => $" {field.Key}={field.Value}"));
        return message + suffix;
    }
}

public static class Boundary
{
    public static AuthResult Authenticate(
        string? header,
        IReadOnlyDictionary<string, string> tokens)
    {
        // Absent is a state with a future (public routes); invalid is not.
        if (header is null)
        {
            return AuthResult.Anonymous();
        }
        if (!header.StartsWith("Bearer ", StringComparison.Ordinal) ||
            header.Length <= "Bearer ".Length ||
            header.IndexOf(' ') != header.LastIndexOf(' '))
        {
            return AuthResult.Invalid("malformed header");
        }

        var token = header["Bearer ".Length..];
        return tokens.TryGetValue(token, out var user)
            ? AuthResult.Authenticated(user)
            : AuthResult.Invalid("unknown token");
    }

    public static string AggregateHealth(IReadOnlyDictionary<string, string> checks)
    {
        // Worst wins, and empty is healthy: no dependencies, nothing sick.
        if (checks.Values.Contains("unhealthy"))
        {
            return "unhealthy";
        }
        return checks.Values.Contains("degraded") ? "degraded" : "healthy";
    }

    public static Problem ToProblem(Exception error, string traceId) => error switch
    {
        // The id the ticket quotes is the id the log contains — that link
        // is the whole point of carrying it in both.
        KeyNotFoundException missing => new Problem(404, missing.Message, traceId),
        ArgumentException bad => new Problem(400, bad.Message, traceId),
        _ => new Problem(500, "internal error", traceId),
    };
}
