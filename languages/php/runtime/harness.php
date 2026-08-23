<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

/**
 * The PHP test harness: one file, no Composer, no PHPUnit.
 *
 * A learner practicing PHP should be writing PHP, not installing a test
 * runner. PHPUnit is the right choice for a real project and the wrong one
 * here: it means Composer, a vendor directory, a network connection and an
 * autoloader, none of which teaches anybody PHP.
 *
 * A test file registers cases with `retrainer_test` and asserts with the
 * `assert_*` helpers:
 *
 *     <?php
 *     require_once __DIR__ . '/../main.php';
 *
 *     retrainer_test('adds two numbers', function () {
 *         assert_equal(5, add(2, 3));
 *     }, 'php.structure.functions');
 *
 * Strict types are declared here and expected in the exercises, because
 * modern PHP with coercion left on is the previous language.
 */

declare(strict_types=1);

/** Raised by an assertion. Carries both sides so the report can show them. */
final class RetrainerAssertion extends Exception
{
    public function __construct(string $message, public readonly string $expected = '', public readonly string $received = '')
    {
        parent::__construct($message);
    }
}

/** @var array<int, array{name: string, body: callable, concept: ?string, file: string, line: int}> */
$RETRAINER_CASES = [];

function retrainer_test(string $name, callable $body, ?string $concept = null): void
{
    global $RETRAINER_CASES;

    // Captured at registration so the report can say where a case lives
    // without anybody parsing a stack trace later.
    $frame = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0] ?? [];

    $RETRAINER_CASES[] = [
        'name' => $name,
        'body' => $body,
        'concept' => $concept,
        // Relative to the sandbox: the engine keys a test file's
        // visibility on the path the exercise declared, and an absolute one
        // matches nothing — so a hidden test would be shown in full.
        'file' => retrainer_relative($frame['file'] ?? 'unknown'),
        'line' => $frame['line'] ?? 0,
    ];
}

/**
 * A path as the exercise declared it: relative to the run, forward slashes.
 *
 * `chr(92)` rather than a backslash literal, so nothing between this file and
 * the interpreter has to escape it correctly.
 */
function retrainer_relative(string $file): string
{
    $backslash = chr(92);
    $root = str_replace($backslash, '/', getcwd() ?: '');
    $path = str_replace($backslash, '/', $file);

    if ($root !== '' && str_starts_with($path, $root . '/')) {
        return substr($path, strlen($root) + 1);
    }
    return $path;
}

function retrainer_show(mixed $value): string
{
    return match (true) {
        $value === null => 'null',
        is_bool($value) => $value ? 'true' : 'false',
        is_string($value) => '"' . $value . '"',
        is_array($value) => json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: 'array',
        is_object($value) => get_class($value),
        default => (string) $value,
    };
}

/**
 * Strict equality, always.
 *
 * `==` in PHP is the single largest source of surprise in the language, and a
 * test framework that used it would be teaching the habit this course exists
 * to break.
 */
function assert_equal(mixed $expected, mixed $actual): void
{
    if ($expected === $actual) {
        return;
    }
    throw new RetrainerAssertion('values differ', retrainer_show($expected), retrainer_show($actual));
}

function assert_true(bool $condition, string $because = 'expected true'): void
{
    if (!$condition) {
        throw new RetrainerAssertion($because, 'true', 'false');
    }
}

function assert_false(bool $condition, string $because = 'expected false'): void
{
    if ($condition) {
        throw new RetrainerAssertion($because, 'false', 'true');
    }
}

/** Floating point, with a tolerance and never with ===. */
function assert_close(float $expected, float $actual, float $tolerance = 1e-9): void
{
    if (abs($expected - $actual) <= $tolerance) {
        return;
    }
    throw new RetrainerAssertion('values differ beyond tolerance', (string) $expected, (string) $actual);
}

function assert_throws(string $class, callable $call): Throwable
{
    try {
        $call();
    } catch (Throwable $caught) {
        if ($caught instanceof $class) {
            return $caught;
        }
        throw new RetrainerAssertion(
            sprintf('threw %s instead of %s', get_class($caught), $class),
            $class,
            get_class($caught)
        );
    }
    throw new RetrainerAssertion(sprintf('expected %s, nothing was thrown', $class), $class, 'no exception');
}

/** Run everything registered and write the shared report. */
function retrainer_run(string $reportPath, array $files): int
{
    global $RETRAINER_CASES;

    $collectionErrors = [];
    foreach ($files as $file) {
        if (!file_exists($file)) {
            $collectionErrors[] = ['path' => $file, 'message' => 'no such test file'];
            continue;
        }
        try {
            require_once $file;
        } catch (Throwable $error) {
            // A file that cannot even be loaded has not been tested, which is
            // a different answer from its tests failing.
            $collectionErrors[] = ['path' => $file, 'message' => $error->getMessage()];
        }
    }

    $cases = [];
    $failures = 0;

    foreach ($RETRAINER_CASES as $entry) {
        $began = hrtime(true);
        $status = 'passed';
        $extra = [];

        try {
            ($entry['body'])();
        } catch (RetrainerAssertion $failure) {
            $status = 'failed';
            $extra = [
                'message' => $failure->getMessage(),
                'expected' => $failure->expected,
                'received' => $failure->received,
            ];
        } catch (Throwable $error) {
            $status = 'errored';
            $extra = [
                'message' => $error->getMessage(),
                'exceptionType' => get_class($error),
            ];
        }

        if ($status !== 'passed') {
            $failures++;
        }

        $cases[] = array_merge([
            'id' => $entry['file'] . '::' . $entry['name'],
            'file' => $entry['file'],
            'name' => $entry['name'],
            'status' => $status,
            'durationMs' => round((hrtime(true) - $began) / 1e6, 3),
            'location' => ['path' => $entry['file'], 'line' => $entry['line']],
        ], $entry['concept'] !== null ? ['concept' => $entry['concept']] : [], $extra);
    }

    $document = [
        'schema' => 1,
        'exitStatus' => ($failures > 0 || $collectionErrors !== []) ? 1 : 0,
        'collectionErrors' => $collectionErrors,
        'cases' => $cases,
    ];

    file_put_contents($reportPath, json_encode($document, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    return $document['exitStatus'];
}

$argv = $_SERVER['argv'] ?? [];
$report = '.retrainer-report.json';
$files = [];

for ($i = 1; $i < count($argv); $i++) {
    if ($argv[$i] === '--report') {
        $report = $argv[++$i] ?? $report;
        continue;
    }
    $files[] = $argv[$i];
}

exit(retrainer_run($report, $files));
