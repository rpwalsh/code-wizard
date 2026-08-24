// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

/// <summary>What a request carries through the pipeline.</summary>
public sealed class Context
{
    public string Path { get; init; } = "/";
    public string? User { get; set; }
    public int Status { get; set; } = 200;
    public List<string> Trail { get; } = new();
}

/// <summary>One stage: do something, call next, do something after.</summary>
public delegate Task Middleware(Context context, Func<Task> next);

public static class Pipeline
{
    public static Func<Context, Task> Build(IEnumerable<Middleware> stages)
    {
        // Composed from the inside out. The terminal does nothing, and each
        // stage wraps whatever was built so far, so the first stage in the
        // list ends up outermost — which is why order is registration order.
        Func<Context, Task> next = _ => Task.CompletedTask;

        foreach (var stage in stages.Reverse())
        {
            var inner = next;
            var current = stage;
            next = context => current(context, () => inner(context));
        }

        return next;
    }

    public static Middleware Trace(string name) => async (context, next) =>
    {
        context.Trail.Add($"{name}:in");
        await next();
        // Recorded after the call, so the trail shows the pipeline unwinding
        // in the reverse of the order it was entered.
        context.Trail.Add($"{name}:out");
    };

    public static Middleware ShortCircuit(int status) => (context, next) =>
    {
        // Never calls next, so nothing further down ever runs.
        context.Status = status;
        return Task.CompletedTask;
    };

    public static Middleware RequireUser() => async (context, next) =>
    {
        if (context.User is null)
        {
            context.Status = 401;
            return;
        }

        await next();
    };

    public static Middleware CatchErrors() => async (context, next) =>
    {
        try
        {
            await next();
        }
        catch (Exception)
        {
            // Outermost by convention, because it can only catch what is
            // thrown by the stages it wrapped.
            context.Status = 500;
        }
    };
}
