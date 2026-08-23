<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

/** The key was not in the request and no default was given. */
class MissingInput extends InvalidArgumentException
{
}

/** The value was present but unusable. A default never hides this. */
class InvalidInput extends InvalidArgumentException
{
}

function read_int(array $input, string $key, ?int $default = null): int
{
    // Absence first: the default answers this question and only this one.
    if (!array_key_exists($key, $input)) {
        if ($default !== null) {
            return $default;
        }
        throw new MissingInput("missing required parameter: {$key}");
    }

    $raw = trim((string) $input[$key]);

    // (int)"42abc" is 42; filter_var is how you find out the truth.
    $value = filter_var($raw, FILTER_VALIDATE_INT);
    if ($value === false) {
        throw new InvalidInput("parameter {$key} is not an integer: {$raw}");
    }

    return $value;
}

function read_enum(array $input, string $key, array $allowed, ?string $default = null): string
{
    if (!array_key_exists($key, $input)) {
        if ($default !== null) {
            return $default;
        }
        throw new MissingInput("missing required parameter: {$key}");
    }

    $value = (string) $input[$key];

    // Strict: "0" and 0 must not collapse into each other here.
    if (!in_array($value, $allowed, true)) {
        throw new InvalidInput("parameter {$key} must be one of: " . implode(', ', $allowed));
    }

    return $value;
}

/** @return array{page: int, per_page: int} */
function read_page(array $input): array
{
    $page = read_int($input, 'page', 1);
    $perPage = read_int($input, 'per_page', 20);

    if ($page < 1) {
        throw new InvalidInput('parameter page must be at least 1');
    }
    if ($perPage < 1 || $perPage > 100) {
        throw new InvalidInput('parameter per_page must be between 1 and 100');
    }

    return ['page' => $page, 'per_page' => $perPage];
}
