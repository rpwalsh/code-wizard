<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

function totals_by_category(array $expenses): array
{
    $totals = [];
    foreach ($expenses as $row) {
        // Insertion order is preserved — the ordered-dictionary half of
        // PHP's one array doing real work.
        $totals[$row['category']] = ($totals[$row['category']] ?? 0) + $row['amount'];
    }
    return $totals;
}

function top_spenders(array $totals, int $count): array
{
    $pairs = [];
    foreach ($totals as $category => $amount) {
        $pairs[] = [$category, $amount];
    }
    usort($pairs, fn (array $a, array $b) => [$b[1], $a[0]] <=> [$a[1], $b[0]]);

    return array_map(fn (array $pair) => $pair[0], array_slice($pairs, 0, max(0, $count)));
}

function above(array $amounts, int $threshold): array
{
    // array_values is the half people forget: filter keeps keys, and a
    // gapped list serializes as an object.
    return array_values(array_filter($amounts, fn (int $a) => $a > $threshold));
}

function make_accumulator(): callable
{
    $total = 0;
    // By reference: use ($total) would copy the value at creation and the
    // closure would return 5 forever.
    return function (int $amount) use (&$total): int {
        $total += $amount;
        return $total;
    };
}

function apply_discounts(array $prices, callable $rule): array
{
    // map preserves keys — a keyed map stays keyed.
    return array_map($rule, $prices);
}
