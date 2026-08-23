// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public sealed record RouteMatch(Dictionary<string, string> Values);

public sealed record ListQuery(string Name, int Page, int PerPage);

public abstract record Bound
{
    public sealed record OkBound(ListQuery Query) : Bound;
    public sealed record InvalidBound(IReadOnlyList<string> Errors) : Bound;

    public static Bound Ok(ListQuery query) => new OkBound(query);
    public static Bound Invalid(IReadOnlyList<string> errors) => new InvalidBound(errors);
}

public static class Routing
{
    public static RouteMatch? MatchTemplate(string template, string path)
    {
        throw new NotImplementedException();
    }

    public static Bound BindListQuery(RouteMatch match, IReadOnlyDictionary<string, string> query)
    {
        throw new NotImplementedException();
    }

    public static string CanonicalPath(string template, IReadOnlyDictionary<string, string> values)
    {
        throw new NotImplementedException();
    }
}
