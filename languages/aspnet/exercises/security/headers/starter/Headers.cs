// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

/// <summary>One request, reduced to what the header policy needs.</summary>
public sealed record Request(string Scheme, string Path, IReadOnlyList<string> EmbeddablePaths);

public static class Policy
{
    public static bool IsSecure(Request request)
    {
        throw new NotImplementedException();
    }

    /// <summary>The existing headers plus whatever the policy adds.</summary>
    public static IDictionary<string, string> Apply(
        Request request,
        IDictionary<string, string> existing)
    {
        throw new NotImplementedException();
    }
}
