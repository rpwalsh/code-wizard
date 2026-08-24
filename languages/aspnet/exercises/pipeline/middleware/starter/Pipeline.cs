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
        throw new NotImplementedException();
    }

    public static Middleware Trace(string name)
    {
        throw new NotImplementedException();
    }

    public static Middleware ShortCircuit(int status)
    {
        throw new NotImplementedException();
    }

    public static Middleware RequireUser()
    {
        throw new NotImplementedException();
    }

    public static Middleware CatchErrors()
    {
        throw new NotImplementedException();
    }
}
