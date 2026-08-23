<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

function transfer(PDO $pdo, string $from, string $to, int $cents): bool
{
    throw new LogicException('not implemented');
}

function safe_message(Throwable $error, callable $log): string
{
    throw new LogicException('not implemented');
}

function satisfies(string $version, string $constraint): bool
{
    throw new LogicException('not implemented');
}
