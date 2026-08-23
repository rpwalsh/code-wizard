<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

interface Notifies
{
    public function notify(string $message): string;
}

trait Signs
{
    public function sign(string $text): string
    {
        // static::class is the using class's name — pasted code sees the
        // world from where it was pasted.
        $class = static::class;
        $cut = strrchr($class, '\\');
        $short = $cut === false ? $class : substr($cut, 1);
        return $text . ' -- ' . $short;
    }
}

final class EmailChannel implements Notifies
{
    use Signs;

    // Declared, typed, assigned and sealed in one line: the modern class.
    public function __construct(public readonly string $address)
    {
    }

    public function notify(string $message): string
    {
        return $this->sign("mail {$this->address}: {$message}");
    }
}

enum Priority: int
{
    case Low = 1;
    case Normal = 2;
    case Urgent = 3;

    public function label(): string
    {
        // The state machine lives with the states; a new case breaks
        // every match that forgot it.
        return match ($this) {
            self::Low => 'low',
            self::Normal => 'normal',
            self::Urgent => 'urgent',
        };
    }

    public function escalate(): self
    {
        return match ($this) {
            self::Low => self::Normal,
            self::Normal => self::Urgent,
            self::Urgent => self::Urgent,
        };
    }
}

function psr4_path(string $prefix, string $baseDir, string $class): ?string
{
    // The whole autoloader, demystified: prefix to directory, backslashes
    // to slashes, .php on the end. No prefix match, no path — next loader.
    if (!str_starts_with($class, $prefix)) {
        return null;
    }
    $rest = substr($class, strlen($prefix));
    return $baseDir . str_replace('\\', '/', $rest) . '.php';
}
