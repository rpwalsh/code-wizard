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
    // is_int rather than is_numeric: under strict_types a string is not an
    // int, and accepting "3" here is how it becomes "33" two calls later.
    if (is_int($raw)) {
        $value = $raw;
    } elseif (is_string($raw) && preg_match('/^-?\d+$/', $raw) === 1) {
        $value = (int) $raw;
    } else {
        throw new ValidationError('quantity', 'quantity must be a whole number');
    }

    if ($value < 1) {
        throw new ValidationError('quantity', 'quantity must be at least 1');
    }

    return $value;
}

function attempt(callable $work): array
{
    try {
        return ['ok' => true, 'value' => $work()];
    } catch (Throwable $error) {
        // Throwable, not Exception: a TypeError from strict_types is an
        // Error, and catching only Exception misses every one of them.
        return ['ok' => false, 'error' => $error->getMessage()];
    }
}

function first_of(array $sources, callable $load): mixed
{
    $failures = [];

    foreach ($sources as $source) {
        try {
            return $load($source);
        } catch (Throwable $error) {
            $failures[] = $error->getMessage();
        }
    }

    throw new RuntimeException(implode('; ', $failures));
}

function with_cleanup(callable $work, callable $cleanup): mixed
{
    try {
        return $work();
    } finally {
        // In a finally, so the cleanup runs on the way out whether that is
        // a return or an exception. A cleanup after the try block is
        // skipped entirely by a throw, which is when it matters most.
        $cleanup();
    }
}
