<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('zero is present, not blank', function () {
    // `empty()` disagrees with every one of these, which is the whole point.
    assert_false(is_blank(0), 'the number zero');
    assert_false(is_blank('0'), 'the string zero');
    assert_false(is_blank(false), 'false');
    assert_false(is_blank([]), 'an empty array');
}, 'php.types.null');

retrainer_test('a stored zero is not a missing field', function () {
    assert_equal('0', field(['count' => 0], 'count'));
    assert_equal('', field(['count' => null], 'count'));
}, 'php.types.null');

retrainer_test('near-numbers are not numbers', function () {
    assert_equal(null, to_int('42abc'));
    assert_equal(null, to_int('4.5'));
    assert_equal(null, to_int(''));
}, 'php.types.declarations');

retrainer_test('booleans and arrays are not numbers', function () {
    // `(int) true` is 1, which is exactly the silent conversion being refused.
    assert_equal(null, to_int(true));
    assert_equal(null, to_int([1]));
}, 'php.types.declarations');

retrainer_test('negative and zero parse', function () {
    assert_equal(-7, to_int('-7'));
    assert_equal(0, to_int('0'));
}, 'php.types.declarations');
