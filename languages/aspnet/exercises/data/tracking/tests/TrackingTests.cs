// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class TrackingTests
{
    [RetrainerTest("an untouched row has no changes", Concept = "aspnet.data.tracking")]
    public void CleanRow()
    {
        var tracker = new ChangeTracker();
        tracker.Attach(new Row("1", new Dictionary<string, string> { ["name"] = "Ada" }));
        Assert.Equal(0, tracker.DetectChanges().Count);
    }

    [RetrainerTest("a mutation shows up as before and after", Concept = "aspnet.data.tracking")]
    public void DirtyRow()
    {
        var tracker = new ChangeTracker();
        var row = tracker.Attach(new Row("1", new Dictionary<string, string> { ["name"] = "Ada" }));

        row.Fields["name"] = "Ada L.";
        var changes = tracker.DetectChanges();

        Assert.Equal(1, changes.Count);
        Assert.Equal(new Change("1", "name", "Ada", "Ada L."), changes[0]);
    }

    [RetrainerTest("save counts, applies, and resets the baseline", Concept = "aspnet.data.tracking")]
    public void SaveResets()
    {
        var tracker = new ChangeTracker();
        var row = tracker.Attach(new Row("1", new Dictionary<string, string> { ["n"] = "1" }));
        row.Fields["n"] = "2";

        Assert.Equal(1, tracker.SaveChanges());
        Assert.Equal(0, tracker.SaveChanges());
    }

    [RetrainerTest("added and removed fields carry nulls", Concept = "aspnet.data.queries")]
    public void AddsAndRemoves()
    {
        var tracker = new ChangeTracker();
        var row = tracker.Attach(new Row("1", new Dictionary<string, string> { ["old"] = "x" }));

        row.Fields.Remove("old");
        row.Fields["fresh"] = "y";

        var changes = tracker.DetectChanges();
        Assert.Equal(2, changes.Count);
        Assert.Equal(new Change("1", "fresh", null, "y"), changes[0]);
        Assert.Equal(new Change("1", "old", "x", null), changes[1]);
    }

    [RetrainerTest("a migration plan lists the differences", Concept = "aspnet.data.migrations")]
    public void PlansMigration()
    {
        var plan = Migrations.PlanMigration(
            new Dictionary<string, string> { ["id"] = "int", ["name"] = "text", ["old"] = "int" },
            new Dictionary<string, string> { ["id"] = "bigint", ["name"] = "text", ["age"] = "int" });

        Assert.Sequence(new[]
        {
            "ADD age int",
            "ALTER id int -> bigint",
            "DROP old",
        }, plan);
    }
}
