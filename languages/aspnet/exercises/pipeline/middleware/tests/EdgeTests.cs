// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("a catcher below the throw cannot catch it", Concept = "aspnet.operations.errors")]
    public void OrderOfCatching()
    {
        // The lesson people learn during an incident: error handling only
        // covers the stages it wrapped, so registering it late covers
        // nothing. The exception escapes the pipeline entirely.
        Middleware boom = (_, _) => throw new InvalidOperationException("no");

        var context = new Context();
        var run = Pipeline.Build(new[] { boom, Pipeline.CatchErrors() });

        var threw = false;
        try
        {
            run(context).Wait();
        }
        catch (Exception)
        {
            // Caught as Exception rather than AggregateException: a lambda
            // that throws before returning a Task throws synchronously, so
            // there is no faulted Task for Wait to wrap.
            threw = true;
        }

        Assert.True(threw);
        Assert.Equal(200, context.Status);
    }

    [RetrainerTest("a stage after a short circuit never runs at all", Concept = "aspnet.pipeline.middleware")]
    public void NothingAfterShortCircuit()
    {
        var context = new Context();
        Pipeline.Build(new[]
        {
            Pipeline.ShortCircuit(403),
            Pipeline.Trace("a"),
            Pipeline.Trace("b"),
        })(context).Wait();

        Assert.Equal(403, context.Status);
        Assert.Equal(0, context.Trail.Count);
    }

    [RetrainerTest("the catcher still unwinds the stages above it", Concept = "aspnet.operations.errors")]
    public void UnwindsAbove()
    {
        Middleware boom = (_, _) => throw new InvalidOperationException("no");

        var context = new Context();
        Pipeline.Build(new[] { Pipeline.Trace("outer"), Pipeline.CatchErrors(), boom })(context).Wait();

        Assert.Equal(500, context.Status);
        // The outer trace completes its own after-work: a swallowed error
        // must not skip the logging and timing wrapped around it.
        Assert.Sequence(new[] { "outer:in", "outer:out" }, context.Trail);
    }

    [RetrainerTest("one stage runs once, not twice", Concept = "aspnet.pipeline.middleware")]
    public void RunsOnce()
    {
        var calls = 0;
        Middleware counting = async (_, next) =>
        {
            calls += 1;
            await next();
        };

        var context = new Context();
        Pipeline.Build(new[] { counting })(context).Wait();

        Assert.Equal(1, calls);
    }

    [RetrainerTest("the same built pipeline serves many requests", Concept = "aspnet.pipeline.middleware")]
    public void Reusable()
    {
        // Built once at startup and called per request, which is the whole
        // point: a pipeline that accumulated state across requests would
        // leak one caller's data into the next.
        var run = Pipeline.Build(new[] { Pipeline.Trace("a") });

        var first = new Context();
        var second = new Context();
        run(first).Wait();
        run(second).Wait();

        Assert.Sequence(new[] { "a:in", "a:out" }, first.Trail);
        Assert.Sequence(new[] { "a:in", "a:out" }, second.Trail);
    }

    [RetrainerTest("authentication placed after the handler protects nothing", Concept = "aspnet.security.authn")]
    public void OrderMattersForAuth()
    {
        var context = new Context();
        Pipeline.Build(new[] { Pipeline.Trace("handler"), Pipeline.RequireUser() })(context).Wait();

        // The handler already ran. The status is set, and the damage is done
        // — which is why the order of registration is a security decision.
        Assert.Equal(401, context.Status);
        Assert.Sequence(new[] { "handler:in", "handler:out" }, context.Trail);
    }

    [RetrainerTest("a deep pipeline still unwinds in the right order", Concept = "aspnet.pipeline.middleware")]
    public void Deep()
    {
        var stages = new List<Middleware>();
        for (var index = 0; index < 5; index += 1)
        {
            stages.Add(Pipeline.Trace(index.ToString()));
        }

        var context = new Context();
        Pipeline.Build(stages)(context).Wait();

        Assert.Sequence(
            new[] { "0:in", "1:in", "2:in", "3:in", "4:in", "4:out", "3:out", "2:out", "1:out", "0:out" },
            context.Trail);
    }
}
