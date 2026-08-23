<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('the home page greets the session user', function () {
    $response = handle(['method' => 'GET', 'path' => '/'], ['user' => 'Ada', 'version' => 1]);
    assert_equal(200, $response['status']);
    assert_equal('<p>Hello, Ada!</p>', $response['body']);
}, 'php.request.lifecycle');

retrainer_test('no session user means guest', function () {
    $response = handle(['method' => 'GET', 'path' => '/'], []);
    assert_equal('<p>Hello, guest!</p>', $response['body']);
}, 'php.request.lifecycle');

retrainer_test('login builds a fresh session', function () {
    $response = handle(
        ['method' => 'POST', 'path' => '/login', 'post' => ['user' => 'Ada']],
        ['version' => 3, 'planted' => 'attacker-data'],
    );
    assert_equal(200, $response['status']);
    assert_equal(['user' => 'Ada', 'version' => 4], $response['session']);
}, 'php.request.sessions');

retrainer_test('logout drops the user and bumps the version', function () {
    $response = handle(['method' => 'POST', 'path' => '/logout'], ['user' => 'Ada', 'version' => 4]);
    assert_equal(['version' => 5], $response['session']);
    assert_equal('bye', $response['body']);
}, 'php.request.sessions');

retrainer_test('unknown routes are 404', function () {
    $response = handle(['method' => 'GET', 'path' => '/nope'], []);
    assert_equal(404, $response['status']);
}, 'php.request.lifecycle');
