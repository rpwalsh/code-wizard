<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

function totals_by_category(array $expenses): array
{
    throw new LogicException('not implemented');
}

function top_spenders(array $totals, int $count): array
{
    throw new LogicException('not implemented');
}

function above(array $amounts, int $threshold): array
{
    throw new LogicException('not implemented');
}

function make_accumulator(): callable
{
    throw new LogicException('not implemented');
}

function apply_discounts(array $prices, callable $rule): array
{
    throw new LogicException('not implemented');
}
