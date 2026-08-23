// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

public readonly record struct Point(int X, int Y);

public class Counter
{
    public int Count { get; private set; }

    public void Increment() => Count += 1;
}

public static class Values
{
    public static Point Move(Point point, int dx, int dy)
    {
        throw new NotImplementedException();
    }

    public static void Bump(Counter counter)
    {
        throw new NotImplementedException();
    }

    public static (Point moved, Point original) MoveBoth(Point start)
    {
        throw new NotImplementedException();
    }

    public static int SumDistances(IReadOnlyList<Point> points)
    {
        throw new NotImplementedException();
    }
}
