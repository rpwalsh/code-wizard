<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('an integral string becomes an int', function () {
    assert_equal(42, read_int(['page' => '42'], 'page'));
}, 'php.request.input');

retrainer_test('surrounding whitespace is forgiven', function () {
    assert_equal(42, read_int(['page' => ' 42 '], 'page'));
}, 'php.request.input');

retrainer_test('a missing key takes the default', function () {
    assert_equal(7, read_int([], 'page', 7));
}, 'php.request.input');

retrainer_test('a missing key without a default is its own error', function () {
    assert_throws(MissingInput::class, fn () => read_int([], 'page'));
}, 'php.request.input');

retrainer_test('trailing garbage is rejected, not truncated', function () {
    // (int)"42abc" would be 42. That silence is the bug.
    assert_throws(InvalidInput::class, fn () => read_int(['page' => '42abc'], 'page'));
}, 'php.request.input');

retrainer_test('an allowed enum value passes through', function () {
    assert_equal('desc', read_enum(['sort' => 'desc'], 'sort', ['asc', 'desc']));
}, 'php.request.input');

retrainer_test('an unlisted enum value is invalid', function () {
    assert_throws(InvalidInput::class, fn () => read_enum(['sort' => 'up'], 'sort', ['asc', 'desc']));
}, 'php.request.input');

retrainer_test('paging defaults apply when nothing is sent', function () {
    assert_equal(['page' => 1, 'per_page' => 20], read_page([]));
}, 'php.request.input');
