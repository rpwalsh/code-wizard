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
        var templateParts = template.Trim('/').Split('/');
        var pathParts = path.Trim('/').Split('/');
        if (templateParts.Length != pathParts.Length)
        {
            return null;
        }

        var values = new Dictionary<string, string>();
        for (var i = 0; i < templateParts.Length; i++)
        {
            var part = templateParts[i];
            var segment = pathParts[i];

            if (part.StartsWith('{') && part.EndsWith('}'))
            {
                if (segment.Length == 0)
                {
                    return null;
                }
                var inner = part[1..^1];
                var pieces = inner.Split(':', 2);
                var name = pieces[0];

                // A constraint failing is silence, not an error: the path
                // slides off this template and other routes get their turn.
                if (pieces.Length == 2 && pieces[1] == "int" && !int.TryParse(segment, out _))
                {
                    return null;
                }
                values[name] = segment;
            }
            else if (!string.Equals(part, segment, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }
        }
        return new RouteMatch(values);
    }

    public static Bound BindListQuery(RouteMatch match, IReadOnlyDictionary<string, string> query)
    {
        var errors = new List<string>();

        var name = match.Values.GetValueOrDefault("name", "");
        if (name.Length == 0)
        {
            errors.Add("name is required");
        }

        // Every problem reported at once — ModelState's shape, rebuilt.
        var page = ReadInt(query, "Page", 1, 1, int.MaxValue, errors);
        var perPage = ReadInt(query, "PerPage", 20, 1, 100, errors);

        return errors.Count > 0
            ? Bound.Invalid(errors)
            : Bound.Ok(new ListQuery(name, page, perPage));
    }

    private static int ReadInt(
        IReadOnlyDictionary<string, string> query,
        string key,
        int fallback,
        int low,
        int high,
        List<string> errors)
    {
        if (!query.TryGetValue(key, out var raw))
        {
            return fallback;
        }
        if (!int.TryParse(raw, out var value))
        {
            errors.Add($"{key} is not a number");
            return fallback;
        }
        if (value < low || value > high)
        {
            errors.Add($"{key} is out of range");
            return fallback;
        }
        return value;
    }

    public static string CanonicalPath(string template, IReadOnlyDictionary<string, string> values)
    {
        var parts = template.Trim('/').Split('/');
        var built = new List<string>();

        foreach (var part in parts)
        {
            if (part.StartsWith('{') && part.EndsWith('}'))
            {
                var name = part[1..^1].Split(':', 2)[0];
                // Throw-on-missing turns a typo'd parameter into a test
                // failure instead of a half-built href in production.
                if (!values.TryGetValue(name, out var value))
                {
                    throw new ArgumentException($"missing route value: {name}", nameof(values));
                }
                built.Add(value);
            }
            else
            {
                built.Add(part);
            }
        }
        return "/" + string.Join('/', built);
    }
}
