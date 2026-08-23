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
    /// <summary>
    /// Cancellation is cooperative: nothing stops this loop except this loop.
    /// The check goes inside it, so a long sequence can be called off part-way
    /// rather than only before it starts.
    /// </summary>
    public static Task<int> SumAsync(IEnumerable<int> numbers, CancellationToken token)
    {
        var total = 0;
        foreach (var number in numbers)
        {
            token.ThrowIfCancellationRequested();
            total += number;
        }
        return Task.FromResult(total);
    }

    public static async Task<Outcome> TryRunAsync(
        Func<CancellationToken, Task<int>> work,
        CancellationToken token)
    {
        try
        {
            return Outcome.Completed(await work(token));
        }
        // Narrowest first. TaskCanceledException derives from this, and this
        // derives from Exception — so putting the general catch above would
        // report every cancellation as a failure.
        catch (OperationCanceledException)
        {
            return Outcome.Canceled();
        }
        catch (Exception error)
        {
            return Outcome.Failed(error.Message);
        }
    }
}
