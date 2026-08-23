// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class HeaderTests
{
    private static readonly string[] None = System.Array.Empty<string>();

    private static Request Http(string path = "/") => new("http", path, None);
    private static Request Https(string path = "/") => new("https", path, None);
    private static Dictionary<string, string> Empty() => new();

    [RetrainerTest("nosniff is always sent", Concept = "aspnet.security.headers")]
    public void NoSniff()
    {
        var headers = Policy.Apply(Http(), Empty());
        Assert.Equal("nosniff", headers["X-Content-Type-Options"]);
    }

    [RetrainerTest("a default content security policy is always sent", Concept = "aspnet.security.headers")]
    public void Csp()
    {
        var headers = Policy.Apply(Http(), Empty());
        Assert.Equal("default-src 'self'", headers["Content-Security-Policy"]);
    }

    [RetrainerTest("HSTS is sent over https", Concept = "aspnet.security.headers")]
    public void HstsOnHttps()
    {
        var headers = Policy.Apply(Https(), Empty());
        Assert.Equal("max-age=31536000", headers["Strict-Transport-Security"]);
    }

    [RetrainerTest("HSTS is not sent over plain http", Concept = "aspnet.security.headers")]
    public void NoHstsOnHttp()
    {
        Assert.False(Policy.Apply(Http(), Empty()).ContainsKey("Strict-Transport-Security"));
    }

    [RetrainerTest("framing is denied by default", Concept = "aspnet.security.headers")]
    public void FrameDenied()
    {
        Assert.Equal("DENY", Policy.Apply(Http(), Empty())["X-Frame-Options"]);
    }

    [RetrainerTest("an embeddable path gets no frame header at all", Concept = "aspnet.security.headers")]
    public void Embeddable()
    {
        var request = new Request("https", "/widget", new[] { "/widget" });
        Assert.False(Policy.Apply(request, Empty()).ContainsKey("X-Frame-Options"));
    }

    [RetrainerTest("https is recognized whatever its casing", Concept = "aspnet.security.headers")]
    public void SchemeCasing()
    {
        Assert.True(Policy.IsSecure(new Request("HTTPS", "/", None)));
        Assert.False(Policy.IsSecure(new Request("http", "/", None)));
    }
}
