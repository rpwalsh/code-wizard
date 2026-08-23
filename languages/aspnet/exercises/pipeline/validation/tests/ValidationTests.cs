// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class ValidationTests
{
    private static readonly Caller Admin = new("ada", true);

    [RetrainerTest("a good request has no problems", Concept = "aspnet.pipeline.validation")]
    public void Valid()
    {
        Assert.Equal(0, Handler.Validate(new CreateUser("a@b.com", "Ada", 36)).Count);
    }

    [RetrainerTest("a missing email is reported", Concept = "aspnet.pipeline.validation")]
    public void MissingEmail()
    {
        var problems = Handler.Validate(new CreateUser(null, "Ada", 36));
        Assert.Equal(new[] { "email is required" }, problems);
    }

    [RetrainerTest("an email without an at sign is reported", Concept = "aspnet.pipeline.validation")]
    public void BadEmail()
    {
        var problems = Handler.Validate(new CreateUser("nope", "Ada", 36));
        Assert.Equal(new[] { "email must contain @" }, problems);
    }

    [RetrainerTest("every problem is reported at once", Concept = "aspnet.pipeline.validation")]
    public void AllProblems()
    {
        // A client that has to fix one field per round trip makes six requests
        // to submit one form.
        var problems = Handler.Validate(new CreateUser(null, null, 900));
        Assert.Equal(
            new[] { "email is required", "name is required", "age must be between 0 and 150" },
            problems);
    }

    [RetrainerTest("a valid request is created", Concept = "aspnet.pipeline.results")]
    public void Created()
    {
        var outcome = Handler.Decide(new CreateUser("a@b.com", "Ada", 36), Admin);
        Assert.Equal(Outcome.Created("a@b.com"), outcome);
    }
}
