// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

/// <summary>The three ways a piece of work can end.</summary>
public abstract record Outcome
{
    public sealed record CompletedOutcome(int Value) : Outcome;
    public sealed record CanceledOutcome : Outcome;
    public sealed record FailedOutcome(string Message) : Outcome;

    public static Outcome Completed(int value) => new CompletedOutcome(value);
    public static Outcome Canceled() => new CanceledOutcome();
    public static Outcome Failed(string message) => new FailedOutcome(message);
}

public static class Work
{
    public static Task<int> SumAsync(IEnumerable<int> numbers, CancellationToken token)
    {
        throw new NotImplementedException();
    }

    public static Task<Outcome> TryRunAsync(
        Func<CancellationToken, Task<int>> work,
        CancellationToken token)
    {
        throw new NotImplementedException();
    }
}
