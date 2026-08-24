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
    throw new RuntimeException('not implemented');
}

function can_move(Status $from, Status $to): bool
{
    throw new RuntimeException('not implemented');
}

function next_states(Status $from): array
{
    throw new RuntimeException('not implemented');
}

function label(Status $status): string
{
    throw new RuntimeException('not implemented');
}
