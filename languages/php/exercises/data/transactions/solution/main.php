<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

function transfer(PDO $pdo, string $from, string $to, int $cents): bool
{
    $pdo->beginTransaction();
    try {
        $read = $pdo->prepare('SELECT balance FROM accounts WHERE name = ?');

        $read->execute([$from]);
        $source = $read->fetchColumn();
        if ($source === false) {
            throw new RuntimeException("no such account: {$from}");
        }

        $read->execute([$to]);
        if ($read->fetchColumn() === false) {
            throw new RuntimeException("no such account: {$to}");
        }

        if ((int) $source < $cents) {
            throw new RuntimeException('insufficient funds');
        }

        $debit = $pdo->prepare('UPDATE accounts SET balance = balance - ? WHERE name = ?');
        $debit->execute([$cents, $from]);
        $credit = $pdo->prepare('UPDATE accounts SET balance = balance + ? WHERE name = ?');
        $credit->execute([$cents, $to]);

        $pdo->commit();
        return true;
    } catch (Throwable $error) {
        // Both halves, always: roll back so no half-transfer is visible,
        // rethrow so the failure is not swallowed.
        $pdo->rollBack();
        throw $error;
    }
}

function safe_message(Throwable $error, callable $log): string
{
    // Log the truth in full; show an allowlist. A blocklist of secrets is
    // a list you hope you enumerated.
    $log(get_class($error) . ': ' . $error->getMessage());

    return $error->getMessage() === 'insufficient funds'
        ? 'insufficient funds'
        : 'something went wrong';
}

function satisfies(string $version, string $constraint): bool
{
    $parse = fn (string $text): array => array_map('intval', explode('.', $text));

    if (str_starts_with($constraint, '^')) {
        $base = $parse(substr($constraint, 1));
        $have = $parse($version);

        if ($base[0] > 0) {
            // Same major, and at least the base: semver's compatibility
            // promise as arithmetic.
            return $have[0] === $base[0]
                && [$have[1], $have[2]] >= [$base[1], $base[2]];
        }
        // 0.x promises nothing across minors, so the caret narrows.
        return $have[0] === 0
            && $have[1] === $base[1]
            && $have[2] >= $base[2];
    }

    return $parse($version) === $parse($constraint);
}
