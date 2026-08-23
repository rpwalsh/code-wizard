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
    throw new LogicException('not implemented');
}

function read_enum(array $input, string $key, array $allowed, ?string $default = null): string
{
    throw new LogicException('not implemented');
}

/** @return array{page: int, per_page: int} */
function read_page(array $input): array
{
    throw new LogicException('not implemented');
}
