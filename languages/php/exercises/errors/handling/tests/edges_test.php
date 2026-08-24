<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('a TypeError is caught too, not only an Exception', function () {
    // Under strict_types a wrong argument type raises TypeError, which
    // extends Error rather than Exception. Catching Exception alone lets
    // every one of them past, and they are the commonest kind here.
    $result = attempt(function () {
        $sum = fn (int $n): int => $n + 1;
        return $sum('not an int');
    });

    assert_equal(false, $result['ok']);
}, 'php.errors.handling');

retrainer_test('a float is not a whole number', function () {
    $caught = false;
    try {
        parse_quantity(2.5);
    } catch (ValidationError) {
        $caught = true;
    }
    assert_equal(true, $caught);
}, 'php.types.coercion');

retrainer_test('a whole-valued float is still not an int', function () {
    // 3.0 is a float. Accepting it means accepting 3.0000001 next.
    $caught = false;
    try {
        parse_quantity(3.0);
    } catch (ValidationError) {
        $caught = true;
    }
    assert_equal(true, $caught);
}, 'php.types.coercion');

retrainer_test('a string with trailing text is refused', function () {
    // (int) "3kg" is 3 and discards the rest without complaint.
    $caught = false;
    try {
        parse_quantity('3kg');
    } catch (ValidationError) {
        $caught = true;
    }
    assert_equal(true, $caught);
}, 'php.types.coercion');

retrainer_test('an empty string is refused rather than becoming zero', function () {
    $caught = false;
    try {
        parse_quantity('');
    } catch (ValidationError) {
        $caught = true;
    }
    assert_equal(true, $caught);
}, 'php.types.coercion');

retrainer_test('true is not one', function () {
    $caught = false;
    try {
        parse_quantity(true);
    } catch (ValidationError) {
        $caught = true;
    }
    assert_equal(true, $caught);
}, 'php.types.coercion');

retrainer_test('first_of reports every failure when nothing works', function () {
    $message = '';
    try {
        first_of(['a', 'b'], function (string $source) {
            throw new RuntimeException("{$source} is down");
        });
    } catch (RuntimeException $error) {
        $message = $error->getMessage();
    }

    assert_equal('a is down; b is down', $message);
}, 'php.errors.handling');

retrainer_test('first_of over no sources still fails rather than returning null', function () {
    $caught = false;
    try {
        first_of([], fn ($source) => $source);
    } catch (RuntimeException) {
        $caught = true;
    }
    assert_equal(true, $caught);
}, 'php.errors.handling');

retrainer_test('cleanup runs when the work throws', function () {
    // The case the finally exists for. A cleanup written after the try
    // block is skipped by the throw, which is precisely when the resource
    // most needs releasing.
    $cleaned = false;
    $caught = false;

    try {
        with_cleanup(function () {
            throw new RuntimeException('boom');
        }, function () use (&$cleaned) {
            $cleaned = true;
        });
    } catch (RuntimeException) {
        $caught = true;
    }

    assert_equal(true, $cleaned);
    assert_equal(true, $caught);
}, 'php.errors.handling');

retrainer_test('the original error still escapes after cleanup', function () {
    $message = '';
    try {
        with_cleanup(function () {
            throw new RuntimeException('the real problem');
        }, fn () => null);
    } catch (RuntimeException $error) {
        $message = $error->getMessage();
    }

    // Swallowing it in the cleanup path would hide the failure entirely.
    assert_equal('the real problem', $message);
}, 'php.errors.handling');
