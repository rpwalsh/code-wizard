// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public class Lease : IDisposable
{
    private readonly string _name;
    private readonly Action<string> _onRelease;
    private bool _disposed;

    public Lease(string name, Action<string> onRelease)
    {
        _name = name;
        _onRelease = onRelease;
    }

    public string Use()
    {
        // Garbage quietly is worse than an exception loudly.
        ObjectDisposedException.ThrowIf(_disposed, this);
        return $"using {_name}";
    }

    public void Dispose()
    {
        // Exactly once: real handles double-free badly, so the contract
        // makes the second call a no-op rather than a repeat.
        if (_disposed)
        {
            return;
        }
        _disposed = true;
        _onRelease(_name);
    }
}

public static class Resources
{
    public static string WithLease(string name, Action<string> onRelease, Func<Lease, string> body)
    {
        // using is try/finally with a name: return, throw, or fall out —
        // every path routes through Dispose.
        using var lease = new Lease(name, onRelease);
        return body(lease);
    }

    public static int SumCsv(ReadOnlySpan<char> line)
    {
        var total = 0;
        while (!line.IsEmpty)
        {
            var comma = line.IndexOf(',');
            // Slice is a window, not a copy: same digits, zero allocations.
            var field = comma < 0 ? line : line.Slice(0, comma);
            total += int.Parse(field);
            if (comma < 0)
            {
                break;
            }
            line = line.Slice(comma + 1);
        }
        return total;
    }

    public static bool TryFirstField(ReadOnlySpan<char> line, out int value)
    {
        var comma = line.IndexOf(',');
        var head = comma < 0 ? line : line.Slice(0, comma);
        return int.TryParse(head, out value);
    }
}
