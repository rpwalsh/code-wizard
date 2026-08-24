<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('a whole number passes through', function () {
    assert_equal(3, parse_quantity(3));
    assert_equal(1, parse_quantity(1));
}, 'php.errors.exceptions');

retrainer_test('a numeric string is accepted and converted', function () {
    assert_equal(7, parse_quantity('7'));
}, 'php.types.coercion');

retrainer_test('a quantity below one is refused by field', function () {
    $caught = null;
    try {
        parse_quantity(0);
    } catch (ValidationError $error) {
        $caught = $error;
    }

    assert_equal('quantity', $caught?->field);
}, 'php.errors.exceptions');

retrainer_test('something that is not a number at all is refused', function () {
    $caught = null;
    try {
        parse_quantity('three');
    } catch (ValidationError $error) {
        $caught = $error;
    }

    assert_equal('quantity', $caught?->field);
}, 'php.errors.exceptions');

retrainer_test('attempt reports a success with its value', function () {
    assert_equal(['ok' => true, 'value' => 42], attempt(fn () => 42));
}, 'php.errors.handling');

retrainer_test('attempt reports a failure with its message', function () {
    $result = attempt(function () {
        throw new RuntimeException('it broke');
    });

    assert_equal(false, $result['ok']);
    assert_equal('it broke', $result['error']);
}, 'php.errors.handling');

retrainer_test('first_of takes the first source that works', function () {
    $value = first_of(['a', 'b', 'c'], function (string $source) {
        if ($source === 'a') {
            throw new RuntimeException('a is down');
        }
        return "loaded {$source}";
    });

    assert_equal('loaded b', $value);
}, 'php.errors.handling');

retrainer_test('with_cleanup returns the value and still cleans up', function () {
    $cleaned = false;
    $value = with_cleanup(fn () => 'done', function () use (&$cleaned) {
        $cleaned = true;
    });

    assert_equal('done', $value);
    assert_equal(true, $cleaned);
}, 'php.errors.handling');
