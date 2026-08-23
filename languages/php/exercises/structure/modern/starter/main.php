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
        throw new LogicException('not implemented');
    }
}

final class EmailChannel implements Notifies
{
    use Signs;

    public function __construct(public readonly string $address)
    {
    }

    public function notify(string $message): string
    {
        throw new LogicException('not implemented');
    }
}

enum Priority: int
{
    case Low = 1;
    case Normal = 2;
    case Urgent = 3;

    public function label(): string
    {
        throw new LogicException('not implemented');
    }

    public function escalate(): self
    {
        throw new LogicException('not implemented');
    }
}

function psr4_path(string $prefix, string $baseDir, string $class): ?string
{
    throw new LogicException('not implemented');
}
