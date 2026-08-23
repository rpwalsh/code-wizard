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
    /// <summary>
    /// Every problem with the request, in a fixed order.
    /// </summary>
    /// <remarks>
    /// All of them rather than the first: a client that has to fix one field
    /// per round trip is a client that makes six requests to submit a form.
    /// </remarks>
    public static IReadOnlyList<string> Validate(CreateUser request)
    {
        var problems = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Email)) problems.Add("email is required");
        else if (!request.Email.Contains('@')) problems.Add("email must contain @");

        if (string.IsNullOrWhiteSpace(request.Name)) problems.Add("name is required");
        if (request.Age < 0 || request.Age > 150) problems.Add("age must be between 0 and 150");

        return problems;
    }

    /// <summary>
    /// Identity, then permission, then the body.
    /// </summary>
    /// <remarks>
    /// The order is a security decision. Validating first would let an
    /// anonymous caller map the shape of the request one 400 at a time.
    /// </remarks>
    public static Outcome Decide(CreateUser request, Caller caller)
    {
        if (string.IsNullOrEmpty(caller.Identity)) return Outcome.Unauthenticated();
        if (!caller.IsAdmin) return Outcome.Forbidden();

        var problems = Validate(request);
        if (problems.Count > 0) return Outcome.Invalid(problems);

        return Outcome.Created(request.Email!);
    }
}
