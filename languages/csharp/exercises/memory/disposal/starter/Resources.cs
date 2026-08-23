// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public class Lease : IDisposable
{
    public Lease(string name, Action<string> onRelease)
    {
        throw new NotImplementedException();
    }

    public string Use()
    {
        throw new NotImplementedException();
    }

    public void Dispose()
    {
        throw new NotImplementedException();
    }
}

public static class Resources
{
    public static string WithLease(string name, Action<string> onRelease, Func<Lease, string> body)
    {
        throw new NotImplementedException();
    }

    public static int SumCsv(ReadOnlySpan<char> line)
    {
        throw new NotImplementedException();
    }

    public static bool TryFirstField(ReadOnlySpan<char> line, out int value)
    {
        throw new NotImplementedException();
    }
}
