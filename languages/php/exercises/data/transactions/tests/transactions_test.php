<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

function fresh_bank(): PDO
{
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE accounts (name TEXT PRIMARY KEY, balance INTEGER NOT NULL)');
    $pdo->exec("INSERT INTO accounts VALUES ('ada', 1000), ('bo', 200)");
    return $pdo;
}

function balance(PDO $pdo, string $name): int
{
    $read = $pdo->prepare('SELECT balance FROM accounts WHERE name = ?');
    $read->execute([$name]);
    return (int) $read->fetchColumn();
}

retrainer_test('a transfer moves the money', function () {
    $pdo = fresh_bank();
    assert_true(transfer($pdo, 'ada', 'bo', 300), 'the transfer should succeed');
    assert_equal(700, balance($pdo, 'ada'));
    assert_equal(500, balance($pdo, 'bo'));
}, 'php.data.transactions');

retrainer_test('a failed transfer changes nothing', function () {
    $pdo = fresh_bank();
    assert_throws(RuntimeException::class, fn () => transfer($pdo, 'bo', 'ada', 5000));
    assert_equal(1000, balance($pdo, 'ada'));
    assert_equal(200, balance($pdo, 'bo'));
}, 'php.data.transactions');

retrainer_test('the boundary logs the truth and shows the safe line', function () {
    $logged = [];
    $shown = safe_message(new PDOException('SQLSTATE[42S02]: no such table: sekrit_audit'),
        function (string $line) use (&$logged) { $logged[] = $line; });

    assert_equal('something went wrong', $shown);
    assert_equal(1, count($logged));
    assert_true(str_contains($logged[0], 'sekrit_audit'), 'the log keeps the details');
}, 'php.errors.handling');

retrainer_test('caret ranges accept compatible versions', function () {
    assert_true(satisfies('1.4.0', '^1.2.3'), '1.4.0 is within ^1.2.3');
    assert_true(satisfies('1.2.3', '^1.2.3'), 'the base itself matches');
    assert_false(satisfies('2.0.0', '^1.2.3'), 'the next major is out');
}, 'php.engineering.composer');
