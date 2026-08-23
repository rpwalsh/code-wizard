// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class BindingTests
{
    [RetrainerTest("literal and parameter segments match", Concept = "aspnet.pipeline.routing")]
    public void Matches()
    {
        var match = Routing.MatchTemplate("products/{id:int}/reviews/{page}", "products/42/reviews/latest");
        Assert.True(match is not null, "the path fits the template");
        Assert.Equal("42", match!.Values["id"]);
        Assert.Equal("latest", match.Values["page"]);
    }

    [RetrainerTest("literals are case-insensitive", Concept = "aspnet.pipeline.routing")]
    public void CaseInsensitive()
    {
        Assert.True(Routing.MatchTemplate("Products/{id}", "products/7") is not null,
            "URLs arrive in every casing");
    }

    [RetrainerTest("binding fills from route and query with defaults", Concept = "aspnet.pipeline.binding")]
    public void Binds()
    {
        var match = Routing.MatchTemplate("category/{name}", "category/tools")!;
        var bound = Routing.BindListQuery(match, new Dictionary<string, string> { ["Page"] = "3" });

        Assert.True(bound is Bound.OkBound, "binding should succeed");
        Assert.Equal(new ListQuery("tools", 3, 20), ((Bound.OkBound)bound).Query);
    }

    [RetrainerTest("the reverse map rebuilds the path", Concept = "aspnet.pipeline.routing")]
    public void Canonical()
    {
        var path = Routing.CanonicalPath("products/{id:int}/reviews/{page}",
            new Dictionary<string, string> { ["id"] = "42", ["page"] = "2" });
        Assert.Equal("/products/42/reviews/2", path);
    }
}
