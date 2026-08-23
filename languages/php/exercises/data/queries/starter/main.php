<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

/** The row for this email, or null. */
function find_user(PDO $pdo, string $email): ?array
{
    throw new RuntimeException('not implemented');
}

/** The rows for these ids, in id order. */
function find_many(PDO $pdo, array $ids): array
{
    throw new RuntimeException('not implemented');
}

/** How many users were created on or after this date. */
function count_since(PDO $pdo, string $isoDate): int
{
    throw new RuntimeException('not implemented');
}
