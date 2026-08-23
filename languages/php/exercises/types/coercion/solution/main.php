<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

/** Identity comparison: no conversion, so no surprises. */
function same(mixed $a, mixed $b): bool
{
    return $a === $b;
}

/**
 * The field as a string.
 *
 * `??` covers both the missing key and a stored null; the cast then turns 0
 * into '0' rather than '', which `empty()` would not have distinguished.
 */
function field(array $row, string $key): string
{
    $value = $row[$key] ?? null;
    return $value === null ? '' : (string) $value;
}

/**
 * True for null, '' and whitespace only.
 *
 * Written out rather than using `empty()`, which is true for 0, '0', false and
 * [] — four things that are present, and none of them blank.
 */
function is_blank(mixed $value): bool
{
    if ($value === null) {
        return true;
    }
    if (!is_string($value)) {
        return false;
    }
    return trim($value) === '';
}

/**
 * An int for something that really is a whole number.
 *
 * `filter_var` returns false rather than throwing, and rejects '4.5' and
 * '42abc' — both of which `(int)` would happily truncate to a plausible
 * number.
 */
function to_int(mixed $value): ?int
{
    if (is_bool($value) || is_array($value) || $value === null) {
        return null;
    }

    $parsed = filter_var($value, FILTER_VALIDATE_INT);
    return $parsed === false ? null : $parsed;
}
