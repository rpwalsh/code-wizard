// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public sealed record Row(string Id, Dictionary<string, string> Fields);

public sealed record Change(string Id, string Field, string? Before, string? After);

public class ChangeTracker
{
    public Row Attach(Row row)
    {
        throw new NotImplementedException();
    }

    public Row AttachNoTracking(Row row)
    {
        throw new NotImplementedException();
    }

    public List<Change> DetectChanges()
    {
        throw new NotImplementedException();
    }

    public int SaveChanges()
    {
        throw new NotImplementedException();
    }
}

public static class Migrations
{
    public static List<string> PlanMigration(
        Dictionary<string, string> current,
        Dictionary<string, string> target)
    {
        throw new NotImplementedException();
    }
}
