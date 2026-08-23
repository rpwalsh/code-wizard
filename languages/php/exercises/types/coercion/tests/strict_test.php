<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('identical values are the same', function () {
    assert_true(same(1, 1), '1 and 1');
    assert_true(same('a', 'a'), 'a and a');
}, 'php.types.coercion');

retrainer_test('different types are never the same', function () {
    assert_false(same(1, '1'), 'int and string');
    assert_false(same(0, ''), 'zero and empty string');
    assert_false(same('1', '01'), 'two numeric strings');
}, 'php.types.coercion');

retrainer_test('a field reads as a string', function () {
    assert_equal('ada', field(['name' => 'ada'], 'name'));
    assert_equal('', field([], 'name'));
}, 'php.types.null');

retrainer_test('blank is about whitespace, not falsiness', function () {
    assert_true(is_blank(null), 'null');
    assert_true(is_blank('   '), 'spaces');
    assert_false(is_blank('a'), 'a letter');
}, 'php.types.null');

retrainer_test('parses a whole number', function () {
    assert_equal(42, to_int(42));
    assert_equal(42, to_int('42'));
}, 'php.types.declarations');
