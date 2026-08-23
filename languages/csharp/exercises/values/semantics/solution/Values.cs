// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

// 8 bytes, no identity, no mutation: the struct trifecta. Lives inline in
// its container, so a million of these in an array is one allocation.
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
        // The parameter is already a copy; building a new Point is the
        // only way a struct "changes".
        return new Point(point.X + dx, point.Y + dy);
    }

    public static void Bump(Counter counter)
    {
        // A class parameter is the same object the caller holds — the
        // increment is visible outside by construction.
        counter.Increment();
    }

    public static (Point moved, Point original) MoveBoth(Point start)
    {
        return (Move(start, 1, 1), start);
    }

    public static int SumDistances(IReadOnlyList<Point> points)
    {
        var total = 0;
        foreach (var point in points)
        {
            total += Math.Abs(point.X) + Math.Abs(point.Y);
        }
        return total;
    }
}
