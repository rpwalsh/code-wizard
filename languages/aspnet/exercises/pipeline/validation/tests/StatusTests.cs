// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class StatusTests
{
    private static readonly CreateUser Good = new("a@b.com", "Ada", 36);
    private static readonly CreateUser Bad = new(null, null, 900);

    [RetrainerTest("no identity is unauthenticated", Concept = "aspnet.security.authz")]
    public void Anonymous()
    {
        Assert.Equal(Outcome.Unauthenticated(), Handler.Decide(Good, new Caller(null, false)));
    }

    [RetrainerTest("a known caller without permission is forbidden", Concept = "aspnet.security.authz")]
    public void NotAdmin()
    {
        // 403, not 401. Sending 401 here puts an authenticated user into a
        // login loop that cannot succeed.
        Assert.Equal(Outcome.Forbidden(), Handler.Decide(Good, new Caller("bob", false)));
    }

    [RetrainerTest("identity is settled before the body is inspected", Concept = "aspnet.security.authz")]
    public void OrderOfChecks()
    {
        // The request is invalid *and* the caller is anonymous. Reporting the
        // validation problems would tell someone with no right to it exactly
        // which fields exist.
        Assert.Equal(Outcome.Unauthenticated(), Handler.Decide(Bad, new Caller(null, false)));
    }

    [RetrainerTest("permission is settled before the body too", Concept = "aspnet.security.authz")]
    public void PermissionBeforeValidation()
    {
        Assert.Equal(Outcome.Forbidden(), Handler.Decide(Bad, new Caller("bob", false)));
    }

    [RetrainerTest("an admin sending rubbish gets the problems", Concept = "aspnet.pipeline.results")]
    public void AdminInvalid()
    {
        var outcome = Handler.Decide(Bad, new Caller("ada", true));
        Assert.True(outcome is Outcome.InvalidOutcome, "expected an invalid outcome");
    }

    [RetrainerTest("the boundaries of the age range are valid", Concept = "aspnet.pipeline.validation")]
    public void AgeBounds()
    {
        Assert.Equal(0, Handler.Validate(new CreateUser("a@b.com", "Ada", 0)).Count);
        Assert.Equal(0, Handler.Validate(new CreateUser("a@b.com", "Ada", 150)).Count);
        Assert.Equal(1, Handler.Validate(new CreateUser("a@b.com", "Ada", 151)).Count);
    }
}
