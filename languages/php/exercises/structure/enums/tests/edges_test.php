<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('case matters when parsing', function () {
    // 'Draft' is not 'draft'. Accepting both is a decision, and silently
    // lowercasing input is how two spellings become two states.
    $caught = false;
    try {
        parse_status('Draft');
    } catch (InvalidArgumentException) {
        $caught = true;
    }
    assert_equal(true, $caught);
}, 'php.structure.enums');

retrainer_test('an empty string is not a status', function () {
    $caught = false;
    try {
        parse_status('');
    } catch (InvalidArgumentException) {
        $caught = true;
    }
    assert_equal(true, $caught);
}, 'php.structure.enums');

retrainer_test('nothing may move to itself', function () {
    foreach (Status::cases() as $status) {
        assert_equal(false, can_move($status, $status));
    }
}, 'php.structure.enums');

retrainer_test('every case has a label and none is empty', function () {
    // Written as a loop over cases(), so a fifth status added later fails
    // here rather than rendering as blank in a template.
    foreach (Status::cases() as $status) {
        assert_equal(true, label($status) !== '');
    }
}, 'php.structure.enums');

retrainer_test('every reachable state is itself a real case', function () {
    // Guards against a transition table naming something that no longer
    // exists, which a string-keyed version cannot detect at all.
    foreach (Status::cases() as $status) {
        foreach (next_states($status) as $next) {
            assert_equal(true, in_array($next, Status::cases(), true));
        }
    }
}, 'php.structure.enums');

retrainer_test('published cannot go back to draft', function () {
    // The rule the whole table exists to enforce: no path from published
    // to draft, directly or by way of review.
    assert_equal(false, can_move(Status::Published, Status::Draft));
    assert_equal(false, can_move(Status::Published, Status::Review));
}, 'php.structure.enums');

retrainer_test('the parsed case is the same object as the constant', function () {
    // Enum cases are singletons, which is why identity comparison works and
    // why in_array needs its strict flag rather than loose matching.
    assert_equal(true, parse_status('draft') === Status::Draft);
}, 'php.structure.enums');
