// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("no-tracking rows are invisible to the tracker", Concept = "aspnet.data.tracking")]
    public void NoTrackingIsFree()
    {
        var tracker = new ChangeTracker();
        var row = tracker.AttachNoTracking(
            new Row("1", new Dictionary<string, string> { ["name"] = "Ada" }));

        // The symmetric bug to watch for: mutate a no-tracking read, save,
        // and nothing happens — cheap reads are reads the tracker never met.
        row.Fields["name"] = "changed";
        Assert.Equal(0, tracker.DetectChanges().Count);
        Assert.Equal(0, tracker.SaveChanges());
    }

    [RetrainerTest("reverting a change makes the row clean again", Concept = "aspnet.data.tracking")]
    public void RevertIsClean()
    {
        var tracker = new ChangeTracker();
        var row = tracker.Attach(new Row("1", new Dictionary<string, string> { ["n"] = "1" }));
        row.Fields["n"] = "2";
        row.Fields["n"] = "1";
        Assert.Equal(0, tracker.DetectChanges().Count);
    }

    [RetrainerTest("changes order by id then field", Concept = "aspnet.data.queries")]
    public void OrderedChanges()
    {
        var tracker = new ChangeTracker();
        var second = tracker.Attach(new Row("2", new Dictionary<string, string> { ["a"] = "1" }));
        var first = tracker.Attach(new Row("1", new Dictionary<string, string> { ["b"] = "1" }));

        second.Fields["a"] = "x";
        first.Fields["b"] = "y";

        var changes = tracker.DetectChanges();
        Assert.Equal("1", changes[0].Id);
        Assert.Equal("2", changes[1].Id);
    }

    [RetrainerTest("identical schemas plan nothing", Concept = "aspnet.data.migrations")]
    public void EmptyPlan()
    {
        var schema = new Dictionary<string, string> { ["id"] = "int" };
        Assert.Equal(0, Migrations.PlanMigration(schema, new(schema)).Count);
    }

    [RetrainerTest("an empty current schema is all adds", Concept = "aspnet.data.migrations")]
    public void AllAdds()
    {
        var plan = Migrations.PlanMigration(
            new Dictionary<string, string>(),
            new Dictionary<string, string> { ["b"] = "int", ["a"] = "text" });
        Assert.Sequence(new[] { "ADD a text", "ADD b int" }, plan);
    }
}
