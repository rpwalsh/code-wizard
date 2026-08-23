// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

/// <summary>One request, reduced to what the header policy needs.</summary>
public sealed record Request(string Scheme, string Path, IReadOnlyList<string> EmbeddablePaths);

public static class Policy
{
    public static bool IsSecure(Request request) =>
        string.Equals(request.Scheme, "https", StringComparison.OrdinalIgnoreCase);

    /// <summary>The existing headers plus whatever the policy adds.</summary>
    public static IDictionary<string, string> Apply(
        Request request,
        IDictionary<string, string> existing)
    {
        // Case-insensitive from the start, because HTTP header names are.
        var result = new Dictionary<string, string>(existing, StringComparer.OrdinalIgnoreCase);

        Add(result, "X-Content-Type-Options", "nosniff");
        Add(result, "Content-Security-Policy", "default-src 'self'");

        // A browser discards HSTS over plain HTTP. Sending it there would only
        // mislead the next person to read this.
        if (IsSecure(request))
        {
            Add(result, "Strict-Transport-Security", "max-age=31536000");
        }

        // The absence of the header is the permission; there is no usable
        // "allow anyone" value to send instead.
        var embeddable = request.EmbeddablePaths.Contains(request.Path);
        if (!embeddable)
        {
            Add(result, "X-Frame-Options", "DENY");
        }

        return result;
    }

    /// <summary>Set the header only if the handler did not already choose one.</summary>
    private static void Add(IDictionary<string, string> headers, string name, string value)
    {
        if (!headers.ContainsKey(name))
        {
            headers[name] = value;
        }
    }
}
