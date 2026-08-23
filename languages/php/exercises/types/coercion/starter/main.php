<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

/** True only when value and type both match. */
function same(mixed $a, mixed $b): bool
{
    throw new RuntimeException('not implemented');
}

/** The field as a string; absent, null and '' all become ''. */
function field(array $row, string $key): string
{
    throw new RuntimeException('not implemented');
}

/** True for null, '' and whitespace only. */
function is_blank(mixed $value): bool
{
    throw new RuntimeException('not implemented');
}

/** An int for a real whole number, or null. */
function to_int(mixed $value): ?int
{
    throw new RuntimeException('not implemented');
}
