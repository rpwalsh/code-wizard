<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('an unknown account rolls back by name', function () {
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE accounts (name TEXT PRIMARY KEY, balance INTEGER NOT NULL)');
    $pdo->exec("INSERT INTO accounts VALUES ('ada', 100)");

    $threw = false;
    try {
        transfer($pdo, 'ada', 'ghost', 50);
    } catch (RuntimeException $error) {
        $threw = str_contains($error->getMessage(), 'ghost');
    }
    assert_true($threw, 'the error names the missing account');

    $read = $pdo->query("SELECT balance FROM accounts WHERE name = 'ada'");
    assert_equal(100, (int) $read->fetchColumn());
}, 'php.data.transactions');

retrainer_test('transferring the entire balance is allowed', function () {
    // Exactly the balance is enough; only a strictly larger amount is not.
    $pdo = fresh_bank();
    assert_true(transfer($pdo, 'bo', 'ada', 200), 'the whole balance should move');
    assert_equal(0, balance($pdo, 'bo'));
    assert_equal(1200, balance($pdo, 'ada'));

    assert_throws(RuntimeException::class, fn () => transfer($pdo, 'bo', 'ada', 1));
}, 'php.data.transactions');

retrainer_test('the user-safe message passes through', function () {
    $shown = safe_message(new RuntimeException('insufficient funds'), fn () => null);
    assert_equal('insufficient funds', $shown);
}, 'php.errors.handling');

retrainer_test('patch and minor bumps stay inside the caret', function () {
    assert_true(satisfies('1.2.4', '^1.2.3'));
    assert_true(satisfies('1.99.0', '^1.2.3'));
    assert_false(satisfies('1.2.2', '^1.2.3'), 'below the base is out');
}, 'php.engineering.composer');

retrainer_test('zero-major carets narrow to the minor', function () {
    assert_true(satisfies('0.3.5', '^0.3.1'));
    assert_false(satisfies('0.4.0', '^0.3.1'), '0.x promises nothing across minors');
    assert_false(satisfies('0.3.0', '^0.3.1'), 'below the base is out');
}, 'php.engineering.composer');

retrainer_test('exact constraints are exact', function () {
    assert_true(satisfies('1.2.3', '1.2.3'));
    assert_false(satisfies('1.2.4', '1.2.3'));
}, 'php.engineering.composer');
