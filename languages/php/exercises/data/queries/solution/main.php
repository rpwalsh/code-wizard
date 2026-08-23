<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

/**
 * The row for this email, or null.
 *
 * The value never touches the SQL string: it is sent separately, after the
 * engine has already parsed the query, so it cannot be read as SQL.
 */
function find_user(PDO $pdo, string $email): ?array
{
    $statement = $pdo->prepare('SELECT id, email, created_at FROM users WHERE email = ?');
    $statement->execute([$email]);

    $row = $statement->fetch(PDO::FETCH_ASSOC);
    return $row === false ? null : $row;
}

/**
 * The rows for these ids, in id order.
 *
 * A placeholder per id. Only the *count* of the input shapes the SQL; none of
 * its values do, which is what keeps this safe for an arbitrary array.
 */
function find_many(PDO $pdo, array $ids): array
{
    if ($ids === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $statement = $pdo->prepare(
        "SELECT id, email, created_at FROM users WHERE id IN ($placeholders) ORDER BY id"
    );
    $statement->execute(array_values($ids));

    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

function count_since(PDO $pdo, string $isoDate): int
{
    $statement = $pdo->prepare('SELECT COUNT(*) FROM users WHERE created_at >= ?');
    $statement->execute([$isoDate]);

    return (int) $statement->fetchColumn();
}
