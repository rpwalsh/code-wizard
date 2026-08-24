<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

enum Status: string
{
    case Draft = 'draft';
    case Review = 'review';
    case Published = 'published';
    case Archived = 'archived';
}

function parse_status(string $raw): Status
{
    // tryFrom returns null for an unknown value; from throws. Using tryFrom
    // and deciding what to do is the difference between a message naming the
    // field and a ValueError from inside the language.
    $status = Status::tryFrom($raw);
    if ($status === null) {
        $known = implode(', ', array_column(Status::cases(), 'value'));
        throw new InvalidArgumentException("unknown status '{$raw}'; expected one of {$known}");
    }
    return $status;
}

function next_states(Status $from): array
{
    // The transitions live in one place. Scattered across four if statements
    // they drift, and the drift is invisible until something is unreachable.
    return match ($from) {
        Status::Draft => [Status::Review, Status::Archived],
        Status::Review => [Status::Draft, Status::Published],
        Status::Published => [Status::Archived],
        Status::Archived => [],
    };
}

function can_move(Status $from, Status $to): bool
{
    // Enum cases are singletons, so identity comparison is exact and needs
    // no value unwrapping.
    return in_array($to, next_states($from), true);
}

function label(Status $status): string
{
    // match is exhaustive over an enum: adding a fifth case makes every
    // match without an arm for it a compile-time error rather than a silent
    // fall-through to a default nobody meant.
    return match ($status) {
        Status::Draft => 'Draft',
        Status::Review => 'In review',
        Status::Published => 'Published',
        Status::Archived => 'Archived',
    };
}
