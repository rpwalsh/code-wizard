<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';
require_once __DIR__ . '/queries_test.php';

retrainer_test('a quote in the input is data, not syntax', function () {
    // Interpolated, this ends the string and adds a clause. Parameterized, it
    // is simply an email address that does not exist.
    $row = find_user(retrainer_pdo(), "' OR '1'='1");
    assert_equal(null, $row);
}, 'php.data.injection');

retrainer_test('a comment sequence is data too', function () {
    assert_equal(null, find_user(retrainer_pdo(), "ada@example.com'--"));
}, 'php.data.injection');

retrainer_test('an empty id list returns nothing and runs no query', function () {
    assert_equal([], find_many(retrainer_pdo(), []));
}, 'php.data.pdo');

retrainer_test('a single id still works', function () {
    $rows = find_many(retrainer_pdo(), [2]);
    assert_equal(1, count($rows));
    assert_equal('grace@example.com', $rows[0]['email']);
}, 'php.data.pdo');

retrainer_test('counting from before everything counts everything', function () {
    assert_equal(3, count_since(retrainer_pdo(), '2025-01-01'));
}, 'php.data.pdo');
