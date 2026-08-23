<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('a filtered list still serializes as a JSON array', function () {
    // Without array_values the keys are 1 and 3, and json_encode emits an
    // object — the API break that happens three calls away from the bug.
    assert_equal('[200,300]', json_encode(above([100, 200, 100, 300], 150)));
}, 'php.types.arrays');

retrainer_test('nothing above the threshold is an empty list', function () {
    assert_equal([], above([1, 2, 3], 100));
    assert_equal('[]', json_encode(above([1, 2], 100)));
}, 'php.types.arrays');

retrainer_test('ties in the ranking break alphabetically', function () {
    $totals = ['zeta' => 100, 'alpha' => 100, 'mid' => 100];
    assert_equal(['alpha', 'mid', 'zeta'], top_spenders($totals, 3));
}, 'php.types.arrays');

retrainer_test('asking for more spenders than exist returns them all', function () {
    assert_equal(['only'], top_spenders(['only' => 5], 10));
    assert_equal([], top_spenders([], 3));
}, 'php.types.arrays');

retrainer_test('two accumulators are independent', function () {
    $first = make_accumulator();
    $second = make_accumulator();
    $first(100);
    assert_equal(1, $second(1));
}, 'php.structure.functions');

retrainer_test('empty expenses total to an empty map', function () {
    assert_equal([], totals_by_category([]));
}, 'php.types.arrays');
