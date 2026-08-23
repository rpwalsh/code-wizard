<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('a decimal is not an integer', function () {
    assert_throws(InvalidInput::class, fn () => read_int(['page' => '4.5'], 'page'));
}, 'php.types.null');

retrainer_test('an empty string is present but invalid, not missing', function () {
    // The default is for absence; an empty value is a broken caller.
    assert_throws(InvalidInput::class, fn () => read_int(['page' => ''], 'page', 5));
}, 'php.types.null');

retrainer_test('zero is a value, not a failure', function () {
    // filter_var returns false on failure; only === can tell 0 apart from it.
    assert_equal(0, read_int(['offset' => '0'], 'offset'));
}, 'php.types.null');

retrainer_test('negative numbers parse', function () {
    assert_equal(-3, read_int(['delta' => '-3'], 'delta'));
}, 'php.request.input');

retrainer_test('enum comparison is strict about case', function () {
    assert_throws(InvalidInput::class, fn () => read_enum(['sort' => 'ASC'], 'sort', ['asc', 'desc']));
}, 'php.request.input');

retrainer_test('a default of zero is a default', function () {
    // PHP 8 still says 0 == null. Only !== can tell a supplied 0 from an
    // absent default, and a paging offset of 0 is an ordinary request.
    assert_equal(0, read_int([], 'offset', 0));
}, 'php.types.null');

retrainer_test('an empty-string enum default is a default', function () {
    assert_equal('', read_enum([], 'sort', ['asc', 'desc'], ''));
}, 'php.types.null');

retrainer_test('enum membership is strict about numeric strings', function () {
    // '01' == '1' loosely — both numeric — so a loose in_array would accept
    // a version string nobody offered.
    assert_throws(InvalidInput::class, fn () => read_enum(['v' => '01'], 'v', ['1']));
    assert_equal('1', read_enum(['v' => '1'], 'v', ['1']));
}, 'php.request.input');

retrainer_test('the paging bounds are inclusive at both ends', function () {
    assert_equal(['page' => 1, 'per_page' => 1], read_page(['per_page' => '1']));
    assert_equal(100, read_page(['per_page' => '100'])['per_page']);
    assert_throws(InvalidInput::class, fn () => read_page(['per_page' => '101']));
    assert_throws(InvalidInput::class, fn () => read_page(['per_page' => '0']));
}, 'php.errors.exceptions');

retrainer_test('a garbage per_page is rejected even though it has a default', function () {
    assert_throws(InvalidInput::class, fn () => read_page(['per_page' => 'lots']));
}, 'php.errors.exceptions');

retrainer_test('page zero is out of range', function () {
    assert_throws(InvalidInput::class, fn () => read_page(['page' => '0']));
}, 'php.errors.exceptions');

retrainer_test('per_page past the cap names the parameter', function () {
    try {
        read_page(['per_page' => '500']);
        assert_true(false, 'expected InvalidInput');
    } catch (InvalidInput $error) {
        assert_true(str_contains($error->getMessage(), 'per_page'), 'the message should name per_page');
    }
}, 'php.errors.exceptions');
