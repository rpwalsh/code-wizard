// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    private static readonly string[] None = System.Array.Empty<string>();

    [RetrainerTest("a header the handler set is left alone", Concept = "aspnet.pipeline.middleware")]
    public void DoesNotOverwrite()
    {
        var existing = new Dictionary<string, string>
        {
            ["Content-Security-Policy"] = "default-src 'self' https://pay.example",
        };

        var headers = Policy.Apply(new Request("https", "/checkout", None), existing);
        Assert.Equal("default-src 'self' https://pay.example", headers["Content-Security-Policy"]);
    }

    [RetrainerTest("a differently cased header is the same header", Concept = "aspnet.pipeline.middleware")]
    public void CaseInsensitive()
    {
        var existing = new Dictionary<string, string> { ["content-security-policy"] = "none" };

        var headers = Policy.Apply(new Request("http", "/", None), existing);
        Assert.Equal("none", headers["Content-Security-Policy"]);
    }

    [RetrainerTest("the handler's own frame choice survives", Concept = "aspnet.pipeline.middleware")]
    public void FrameNotOverwritten()
    {
        var existing = new Dictionary<string, string> { ["X-Frame-Options"] = "SAMEORIGIN" };

        var headers = Policy.Apply(new Request("http", "/", None), existing);
        Assert.Equal("SAMEORIGIN", headers["X-Frame-Options"]);
    }

    [RetrainerTest("unrelated headers are carried through", Concept = "aspnet.pipeline.middleware")]
    public void CarriesOthers()
    {
        var existing = new Dictionary<string, string> { ["Content-Type"] = "application/json" };

        var headers = Policy.Apply(new Request("http", "/", None), existing);
        Assert.Equal("application/json", headers["Content-Type"]);
    }

    [RetrainerTest("the caller's dictionary is not modified", Concept = "aspnet.pipeline.middleware")]
    public void DoesNotMutateInput()
    {
        var existing = new Dictionary<string, string>();
        Policy.Apply(new Request("https", "/", None), existing);
        Assert.Equal(0, existing.Count);
    }

    [RetrainerTest("only the listed path is embeddable", Concept = "aspnet.pipeline.middleware")]
    public void OtherPathsStillDenied()
    {
        var request = new Request("https", "/admin", new[] { "/widget" });
        Assert.Equal("DENY", Policy.Apply(request, new Dictionary<string, string>())["X-Frame-Options"]);
    }
}
