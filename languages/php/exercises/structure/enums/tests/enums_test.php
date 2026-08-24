<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('a known value parses to its case', function () {
    assert_equal(Status::Review, parse_status('review'));
    assert_equal(Status::Draft, parse_status('draft'));
}, 'php.structure.enums');

retrainer_test('an unknown value is refused by name', function () {
    $message = '';
    try {
        parse_status('deleted');
    } catch (InvalidArgumentException $error) {
        $message = $error->getMessage();
    }

    assert_equal(true, str_contains($message, 'deleted'));
    assert_equal(true, str_contains($message, 'draft'));
}, 'php.structure.enums');

retrainer_test('a draft may go to review or the archive', function () {
    assert_equal([Status::Review, Status::Archived], next_states(Status::Draft));
}, 'php.structure.enums');

retrainer_test('the archive is the end', function () {
    assert_equal([], next_states(Status::Archived));
}, 'php.structure.enums');

retrainer_test('permitted moves are allowed', function () {
    assert_equal(true, can_move(Status::Draft, Status::Review));
    assert_equal(true, can_move(Status::Review, Status::Published));
}, 'php.structure.enums');

retrainer_test('forbidden moves are refused', function () {
    assert_equal(false, can_move(Status::Draft, Status::Published));
    assert_equal(false, can_move(Status::Archived, Status::Draft));
}, 'php.structure.enums');

retrainer_test('each case has a label for a person', function () {
    assert_equal('In review', label(Status::Review));
    assert_equal('Draft', label(Status::Draft));
}, 'php.structure.enums');
