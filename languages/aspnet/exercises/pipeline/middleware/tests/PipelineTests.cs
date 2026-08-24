// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class PipelineTests
{
    [RetrainerTest("an empty pipeline leaves the context alone", Concept = "aspnet.pipeline.middleware")]
    public void Empty()
    {
        var context = new Context { Path = "/orders" };
        Pipeline.Build(Array.Empty<Middleware>())(context).Wait();

        Assert.Equal(200, context.Status);
        Assert.Equal(0, context.Trail.Count);
    }

    [RetrainerTest("stages run in registration order", Concept = "aspnet.pipeline.middleware")]
    public void Order()
    {
        var context = new Context();
        Pipeline.Build(new[] { Pipeline.Trace("a"), Pipeline.Trace("b") })(context).Wait();

        // In on the way down, out on the way back up. The pipeline is a
        // stack, not a queue, and the trail shows it.
        Assert.Sequence(new[] { "a:in", "b:in", "b:out", "a:out" }, context.Trail);
    }

    [RetrainerTest("a stage that does not call next stops the rest", Concept = "aspnet.pipeline.middleware")]
    public void ShortCircuit()
    {
        var context = new Context();
        Pipeline.Build(new[] { Pipeline.Trace("a"), Pipeline.ShortCircuit(404), Pipeline.Trace("b") })(
            context).Wait();

        Assert.Equal(404, context.Status);
        // 'b' never ran, and 'a' still completed on the way out.
        Assert.Sequence(new[] { "a:in", "a:out" }, context.Trail);
    }

    [RetrainerTest("an anonymous request is refused before the handler", Concept = "aspnet.security.authn")]
    public void Anonymous()
    {
        var context = new Context();
        Pipeline.Build(new[] { Pipeline.RequireUser(), Pipeline.Trace("handler") })(context).Wait();

        Assert.Equal(401, context.Status);
        Assert.Equal(0, context.Trail.Count);
    }

    [RetrainerTest("a signed-in request reaches the handler", Concept = "aspnet.security.authn")]
    public void SignedIn()
    {
        var context = new Context { User = "ada" };
        Pipeline.Build(new[] { Pipeline.RequireUser(), Pipeline.Trace("handler") })(context).Wait();

        Assert.Equal(200, context.Status);
        Assert.Sequence(new[] { "handler:in", "handler:out" }, context.Trail);
    }

    [RetrainerTest("an error below the catcher becomes a 500", Concept = "aspnet.operations.errors")]
    public void Caught()
    {
        Middleware boom = (_, _) => throw new InvalidOperationException("no");

        var context = new Context();
        Pipeline.Build(new[] { Pipeline.CatchErrors(), boom })(context).Wait();

        Assert.Equal(500, context.Status);
    }
}
