<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

/** Thrown when input fails validation, carrying the field at fault. */
final class ValidationError extends InvalidArgumentException
{
    public function __construct(public readonly string $field, string $message)
    {
        parent::__construct($message);
    }
}

function parse_quantity(mixed $raw): int
{
    throw new RuntimeException('not implemented');
}

function attempt(callable $work): array
{
    throw new RuntimeException('not implemented');
}

function first_of(array $sources, callable $load): mixed
{
    throw new RuntimeException('not implemented');
}

function with_cleanup(callable $work, callable $cleanup): mixed
{
    throw new RuntimeException('not implemented');
}
