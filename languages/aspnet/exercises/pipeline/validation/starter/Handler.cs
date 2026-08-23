// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public sealed record CreateUser(string? Email, string? Name, int Age);

/// <summary>Who is asking. A null identity means nobody has authenticated.</summary>
public sealed record Caller(string? Identity, bool IsAdmin);

public abstract record Outcome
{
    public sealed record CreatedOutcome(string Email) : Outcome;
    public sealed record InvalidOutcome(IReadOnlyList<string> Problems) : Outcome;
    public sealed record UnauthenticatedOutcome : Outcome;
    public sealed record ForbiddenOutcome : Outcome;

    public static Outcome Created(string email) => new CreatedOutcome(email);
    public static Outcome Invalid(IReadOnlyList<string> problems) => new InvalidOutcome(problems);
    public static Outcome Unauthenticated() => new UnauthenticatedOutcome();
    public static Outcome Forbidden() => new ForbiddenOutcome();
}

public static class Handler
{
    public static IReadOnlyList<string> Validate(CreateUser request)
    {
        throw new NotImplementedException();
    }

    public static Outcome Decide(CreateUser request, Caller caller)
    {
        throw new NotImplementedException();
    }
}
