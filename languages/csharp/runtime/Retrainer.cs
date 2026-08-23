// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
// The C# test harness: attributes, reflection, and one JSON document out.
//
// A learner practicing C# should be writing C#, not configuring a test SDK. So
// there is no xunit, no NUnit and no `dotnet test` — a single source file
// compiled into the same assembly as the exercise, which finds tests by
// reflection and writes the report every other language in this platform
// writes.
//
// That is a deliberate trade. A real project should absolutely use xunit; this
// is not a real project, it is a practice environment, and pulling a test SDK
// means a NuGet restore, a network connection, and a first run that takes
// thirty seconds on a hotel wifi. None of that teaches anyone C#.
//
// A test file looks like this:
//
//     public class DictionaryTests
//     {
//         [RetrainerTest("looks up a missing key safely", Concept = "csharp.values.nullable")]
//         public void MissingKey()
//         {
//             Assert.Equal(0, Lookup.Balance(new(), "nobody"));
//         }
//     }
//
// Cases run in a stable order — by type name, then by method name — because a
// suite whose order changes between runs is a suite where a failure cannot be
// reproduced.

using System;
using System.Collections;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;

namespace Retrainer;

[AttributeUsage(AttributeTargets.Method)]
public sealed class RetrainerTestAttribute : Attribute
{
    /// <summary>
    /// The file is captured by the compiler, not passed by the author.
    /// </summary>
    /// <remarks>
    /// Reflection can find the method but not the file it was written in —
    /// that lives in the PDB and reading it would mean a symbol library. A
    /// caller-info parameter has the compiler write the path in at the call
    /// site, which costs nothing and is exact.
    ///
    /// It matters because the platform keys a test file's visibility on its
    /// declared path. Without it, a case from a hidden file would be filed
    /// under a class name, match nothing, and be shown in full.
    /// </remarks>
    public RetrainerTestAttribute(string name, [CallerFilePath] string file = "")
    {
        Name = name;
        File = file;
    }

    public string Name { get; }

    /// <summary>Absolute at compile time; made relative when reported.</summary>
    public string File { get; }

    /// <summary>The skill this case probes, surfaced on failure.</summary>
    public string? Concept { get; set; }
}

/// <summary>Thrown by <see cref="Assert"/>. Carries both sides of the comparison.</summary>
public sealed class AssertionException : Exception
{
    public AssertionException(string message, string? expected, string? received)
        : base(message)
    {
        Expected = expected;
        Received = received;
    }

    public string? Expected { get; }
    public string? Received { get; }
}

public static class Assert
{
    public static void True(bool condition, string? because = null)
    {
        if (!condition) throw new AssertionException(because ?? "expected true", "true", "false");
    }

    public static void False(bool condition, string? because = null)
    {
        if (condition) throw new AssertionException(because ?? "expected false", "false", "true");
    }

    public static void Equal<T>(T expected, T actual)
    {
        // Sequences compare element-wise. Reference equality on two lists with
        // the same contents is the single most confusing default in a test
        // framework, and every learner meets it on their first list exercise.
        if (expected is IEnumerable left && actual is IEnumerable right && expected is not string)
        {
            if (SequencesEqual(left, right)) return;
            throw new AssertionException("sequences differ", Show(expected), Show(actual));
        }

        if (Equals(expected, actual)) return;
        throw new AssertionException("values differ", Show(expected), Show(actual));
    }

    /// <summary>Two sequences, element by element.</summary>
    /// <remarks>
    /// Separate from <see cref="Equal{T}"/> because inference cannot pick one
    /// `T` for an `int[]` and a `List&lt;int&gt;` — a real and confusing
    /// compile error for anybody comparing a literal array against a query
    /// result, which is most tests. Taking two `IEnumerable&lt;T&gt;` makes
    /// the common case compile and says plainly what is being compared.
    /// </remarks>
    public static void Sequence<T>(IEnumerable<T> expected, IEnumerable<T> actual)
    {
        var left = expected.ToList();
        var right = actual.ToList();

        if (left.Count == right.Count && left.Zip(right).All(pair => Equals(pair.First, pair.Second)))
        {
            return;
        }

        throw new AssertionException("sequences differ", Show(left), Show(right));
    }

    public static void NotEqual<T>(T unexpected, T actual)
    {
        if (!Equals(unexpected, actual)) return;
        throw new AssertionException("values are equal but should not be", $"not {Show(unexpected)}", Show(actual));
    }

    /// <summary>Floating point, always with a tolerance and never with ==.</summary>
    public static void Close(double expected, double actual, double tolerance = 1e-9)
    {
        if (Math.Abs(expected - actual) <= tolerance) return;
        throw new AssertionException("values differ beyond tolerance", Show(expected), Show(actual));
    }

    public static void Null(object? value)
    {
        if (value is null) return;
        throw new AssertionException("expected null", "null", Show(value));
    }

    public static void NotNull(object? value)
    {
        if (value is not null) return;
        throw new AssertionException("expected a value", "not null", "null");
    }

    public static TException Throws<TException>(Action action) where TException : Exception
    {
        try
        {
            action();
        }
        catch (TException matched)
        {
            return matched;
        }
        catch (Exception other)
        {
            throw new AssertionException(
                $"threw {other.GetType().Name} instead of {typeof(TException).Name}",
                typeof(TException).Name,
                other.GetType().Name);
        }

        throw new AssertionException(
            $"expected {typeof(TException).Name}, nothing was thrown",
            typeof(TException).Name,
            "no exception");
    }

    private static bool SequencesEqual(IEnumerable left, IEnumerable right)
    {
        var a = left.Cast<object?>().ToList();
        var b = right.Cast<object?>().ToList();
        return a.Count == b.Count && a.Zip(b).All(pair => Equals(pair.First, pair.Second));
    }

    internal static string Show(object? value) => value switch
    {
        null => "null",
        string text => $"\"{text}\"",
        double number => number.ToString("R", CultureInfo.InvariantCulture),
        float number => number.ToString("R", CultureInfo.InvariantCulture),
        IEnumerable sequence when value is not string =>
            "[" + string.Join(", ", sequence.Cast<object?>().Select(Show)) + "]",
        IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
        _ => value.ToString() ?? "null",
    };
}

public static class Harness
{
    public static int Main(string[] args)
    {
        var reportPath = args.Length > 0 ? args[0] : ".retrainer-report.json";

        var cases = Assembly.GetExecutingAssembly()
            .GetTypes()
            .SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.Instance))
            .Select(method => (method, attribute: method.GetCustomAttribute<RetrainerTestAttribute>()))
            .Where(entry => entry.attribute is not null)
            .OrderBy(entry => entry.method.DeclaringType?.FullName, StringComparer.Ordinal)
            .ThenBy(entry => entry.method.Name, StringComparer.Ordinal)
            .ToList();

        var json = new StringBuilder();
        json.Append("{\"schema\":1,\"collectionErrors\":[],\"cases\":[");

        var failures = 0;
        for (var index = 0; index < cases.Count; index++)
        {
            var (method, attribute) = cases[index];
            var declaring = method.DeclaringType!;
            var stopwatch = Stopwatch.StartNew();

            string status = "passed";
            string? message = null, expected = null, received = null, exceptionType = null;

            try
            {
                var instance = method.IsStatic ? null : Activator.CreateInstance(declaring);
                method.Invoke(instance, null);
            }
            catch (TargetInvocationException wrapper) when (wrapper.InnerException is AssertionException failure)
            {
                status = "failed";
                message = failure.Message;
                expected = failure.Expected;
                received = failure.Received;
            }
            catch (TargetInvocationException wrapper)
            {
                // An exception that is not an assertion is a different result
                // about the learner: the code did not run, rather than ran and
                // was wrong.
                var inner = wrapper.InnerException ?? wrapper;
                status = "errored";
                message = inner.Message;
                exceptionType = inner.GetType().Name;
            }
            catch (Exception error)
            {
                status = "errored";
                message = error.Message;
                exceptionType = error.GetType().Name;
            }

            stopwatch.Stop();
            if (status != "passed") failures++;

            if (index > 0) json.Append(',');
            // `path::name`, because the engine keys a test file's visibility
            // and its collection check on the file portion of the id.
            var file = RelativeFile(attribute!.File, declaring.Name);
            json.Append("{\"id\":").Append(Quote($"{file}::{declaring.Name}.{method.Name}"));
            json.Append(",\"file\":").Append(Quote(file));
            json.Append(",\"name\":").Append(Quote(attribute!.Name));
            json.Append(",\"status\":\"").Append(status).Append('"');
            json.Append(",\"durationMs\":")
                .Append(stopwatch.Elapsed.TotalMilliseconds.ToString("0.###", CultureInfo.InvariantCulture));
            if (attribute.Concept is { Length: > 0 }) json.Append(",\"concept\":").Append(Quote(attribute.Concept));
            if (message is not null) json.Append(",\"message\":").Append(Quote(message));
            if (expected is not null) json.Append(",\"expected\":").Append(Quote(expected));
            if (received is not null) json.Append(",\"received\":").Append(Quote(received));
            if (exceptionType is not null) json.Append(",\"exceptionType\":").Append(Quote(exceptionType));
            json.Append('}');
        }

        json.Append("],\"exitStatus\":").Append(failures > 0 ? 1 : 0).Append('}');
        File.WriteAllText(reportPath, json.ToString());
        return failures > 0 ? 1 : 0;
    }

    /// <summary>
    /// The compiled-in absolute path, relative to where the tests are running.
    /// </summary>
    private static string RelativeFile(string absolute, string fallback)
    {
        if (string.IsNullOrEmpty(absolute)) return fallback;
        try
        {
            return Path.GetRelativePath(Directory.GetCurrentDirectory(), absolute)
                .Replace(Path.DirectorySeparatorChar, '/');
        }
        catch
        {
            return fallback;
        }
    }

    private static string Quote(string text)
    {
        var builder = new StringBuilder("\"");
        foreach (var character in text)
        {
            switch (character)
            {
                case '"': builder.Append("\\\""); break;
                case '\\': builder.Append("\\\\"); break;
                case '\n': builder.Append("\\n"); break;
                case '\r': builder.Append("\\r"); break;
                case '\t': builder.Append("\\t"); break;
                default:
                    if (character < 0x20) builder.Append("\\u").Append(((int)character).ToString("x4"));
                    else builder.Append(character);
                    break;
            }
        }
        return builder.Append('"').ToString();
    }
}
