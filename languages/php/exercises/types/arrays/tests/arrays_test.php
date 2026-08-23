<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('totals group by category in first-seen order', function () {
    $expenses = [
        ['category' => 'food', 'amount' => 20],
        ['category' => 'rent', 'amount' => 900],
        ['category' => 'food', 'amount' => 35],
    ];
    assert_equal(['food' => 55, 'rent' => 900], totals_by_category($expenses));
}, 'php.types.arrays');

retrainer_test('top spenders rank by amount', function () {
    $totals = ['food' => 55, 'rent' => 900, 'fun' => 120];
    assert_equal(['rent', 'fun'], top_spenders($totals, 2));
}, 'php.types.arrays');

retrainer_test('above filters and re-indexes', function () {
    assert_equal([200, 300], above([100, 200, 50, 300], 150));
}, 'php.types.arrays');

retrainer_test('an accumulator keeps its own total', function () {
    $acc = make_accumulator();
    assert_equal(5, $acc(5));
    assert_equal(8, $acc(3));
}, 'php.structure.functions');

retrainer_test('discounts map over values, keys intact', function () {
    $prices = ['tea' => 250, 'jam' => 400];
    $halved = apply_discounts($prices, fn (int $p) => intdiv($p, 2));
    assert_equal(['tea' => 125, 'jam' => 200], $halved);
}, 'php.structure.functions');
