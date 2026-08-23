// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public sealed record Row(string Id, Dictionary<string, string> Fields);

public sealed record Change(string Id, string Field, string? Before, string? After);

public class ChangeTracker
{
    private readonly Dictionary<string, Row> _live = new();
    private readonly Dictionary<string, Dictionary<string, string>> _snapshots = new();

    public Row Attach(Row row)
    {
        _live[row.Id] = row;
        // The copy IS the design: an aliased snapshot updates itself to
        // match the present, every row reads clean forever, and
        // SaveChanges writes nothing while the tests stay green.
        _snapshots[row.Id] = new Dictionary<string, string>(row.Fields);
        return row;
    }

    public Row AttachNoTracking(Row row)
    {
        // No snapshot, no bookkeeping: reads that never save stay cheap,
        // and mutations to them are invisible to DetectChanges — honestly.
        return row;
    }

    public List<Change> DetectChanges()
    {
        var changes = new List<Change>();

        foreach (var (id, row) in _live)
        {
            var snapshot = _snapshots[id];
            var keys = snapshot.Keys.Union(row.Fields.Keys);

            foreach (var key in keys)
            {
                var before = snapshot.GetValueOrDefault(key);
                var after = row.Fields.GetValueOrDefault(key);
                if (before != after)
                {
                    changes.Add(new Change(id, key, before, after));
                }
            }
        }

        return changes
            .OrderBy(change => change.Id, StringComparer.Ordinal)
            .ThenBy(change => change.Field, StringComparer.Ordinal)
            .ToList();
    }

    public int SaveChanges()
    {
        var count = DetectChanges().Count;
        // Accepted-changes semantics: the present becomes the baseline,
        // so a second save writes nothing.
        foreach (var (id, row) in _live)
        {
            _snapshots[id] = new Dictionary<string, string>(row.Fields);
        }
        return count;
    }
}

public static class Migrations
{
    public static List<string> PlanMigration(
        Dictionary<string, string> current,
        Dictionary<string, string> target)
    {
        var steps = new List<string>();

        foreach (var (name, type) in target)
        {
            if (!current.ContainsKey(name))
            {
                steps.Add($"ADD {name} {type}");
            }
            else if (current[name] != type)
            {
                steps.Add($"ALTER {name} {current[name]} -> {type}");
            }
        }
        foreach (var name in current.Keys)
        {
            if (!target.ContainsKey(name))
            {
                steps.Add($"DROP {name}");
            }
        }

        steps.Sort(StringComparer.Ordinal);
        return steps;
    }
}
