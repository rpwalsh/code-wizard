// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("a failed constraint is a non-match, not an error", Concept = "aspnet.pipeline.routing")]
    public void ConstraintIsSilence()
    {
        // products/abc slides off {id:int} — which is what lets an
        // {id:int} route and a {slug} route coexist.
        Assert.True(Routing.MatchTemplate("products/{id:int}", "products/abc") is null,
            "abc does not satisfy :int");
        Assert.True(Routing.MatchTemplate("products/{slug}", "products/abc") is not null,
            "the unconstrained template takes it");
    }

    [RetrainerTest("segment counts must agree", Concept = "aspnet.pipeline.routing")]
    public void SegmentCounts()
    {
        Assert.True(Routing.MatchTemplate("a/{x}", "a/b/c") is null, "too long");
        Assert.True(Routing.MatchTemplate("a/{x}/c", "a/b") is null, "too short");
    }

    [RetrainerTest("binding reports every failure at once", Concept = "aspnet.pipeline.binding")]
    public void AllErrors()
    {
        var match = Routing.MatchTemplate("category/{name}", "category/tools")!;
        var bound = Routing.BindListQuery(match,
            new Dictionary<string, string> { ["Page"] = "zero", ["PerPage"] = "5000" });

        Assert.True(bound is Bound.InvalidBound, "binding should fail");
        var invalid = (Bound.InvalidBound)bound;
        Assert.Equal(2, invalid.Errors.Count);
        Assert.True(invalid.Errors[0].Contains("Page"), "each error names its field");
    }

    [RetrainerTest("range violations name the field", Concept = "aspnet.pipeline.binding")]
    public void RangeCheck()
    {
        var match = Routing.MatchTemplate("category/{name}", "category/x")!;
        var bound = Routing.BindListQuery(match, new Dictionary<string, string> { ["Page"] = "0" });
        Assert.True(bound is Bound.InvalidBound, "binding should fail");
        Assert.True(((Bound.InvalidBound)bound).Errors[0].Contains("Page"),
            "page zero is out of range");
    }

    [RetrainerTest("an unfilled parameter throws by name", Concept = "aspnet.pipeline.routing")]
    public void MissingRouteValue()
    {
        var error = Assert.Throws<ArgumentException>(() =>
            Routing.CanonicalPath("products/{id}", new Dictionary<string, string>()));
        Assert.True(error.Message.Contains("id"), "the message names the hole");
    }
}
