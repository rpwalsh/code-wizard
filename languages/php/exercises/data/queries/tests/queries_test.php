<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

function retrainer_pdo(): PDO
{
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, created_at TEXT NOT NULL)');
    $pdo->exec("INSERT INTO users (id, email, created_at) VALUES
        (1, 'ada@example.com', '2026-01-01'),
        (2, 'grace@example.com', '2026-02-01'),
        (3, 'linus@example.com', '2026-03-01')");
    return $pdo;
}

retrainer_test('finds a user by email', function () {
    $row = find_user(retrainer_pdo(), 'grace@example.com');
    assert_true($row !== null, 'expected a row');
    assert_equal(2, (int) $row['id']);
}, 'php.data.pdo');

retrainer_test('returns null for an unknown email', function () {
    assert_equal(null, find_user(retrainer_pdo(), 'nobody@example.com'));
}, 'php.data.pdo');

retrainer_test('finds several by id, in order', function () {
    $rows = find_many(retrainer_pdo(), [3, 1]);
    assert_equal(2, count($rows));
    assert_equal(1, (int) $rows[0]['id']);
    assert_equal(3, (int) $rows[1]['id']);
}, 'php.data.pdo');

retrainer_test('counts from a date', function () {
    assert_equal(2, count_since(retrainer_pdo(), '2026-02-01'));
}, 'php.data.pdo');
