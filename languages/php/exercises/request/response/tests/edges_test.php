<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('a script in the name comes out inert', function () {
    $body = render_greeting('<script>alert(1)</script>');
    assert_true(!str_contains($body, '<script>'), 'no live tags in output');
    assert_true(str_contains($body, '&lt;script&gt;'), 'the text survives, escaped');
}, 'php.request.output');

retrainer_test('quotes are escaped too', function () {
    assert_equal('&quot;x&quot; &amp; &#039;y&#039;', e('"x" & \'y\''));
}, 'php.request.output');

retrainer_test('an empty login is refused without touching the session', function () {
    $session = ['version' => 7];
    $response = handle(['method' => 'POST', 'path' => '/login', 'post' => []], $session);
    assert_equal(422, $response['status']);
    assert_equal($session, $response['session']);
}, 'php.request.sessions');

retrainer_test('the planted key does not survive login', function () {
    $response = handle(
        ['method' => 'POST', 'path' => '/login', 'post' => ['user' => 'Bo']],
        ['fixated' => 'evil'],
    );
    assert_true(!array_key_exists('fixated', $response['session']), 'fresh means fresh');
}, 'php.request.sessions');

retrainer_test('an empty method or path is present, not absent', function () {
    // ?? asks "is the key missing"; ?: asks "is the value falsy" — and an
    // empty string is a present value that routes nowhere.
    assert_equal(404, handle(['method' => '', 'path' => '/'], [])['status']);
    assert_equal(404, handle(['method' => 'GET', 'path' => ''], [])['status']);
}, 'php.request.lifecycle');

retrainer_test('a user named 0 is a user', function () {
    // '0' is falsy in PHP and is also somebody's name. ?: would replace it
    // with 'guest'; ?? keeps it.
    $response = handle(['method' => 'GET', 'path' => '/'], ['user' => '0']);
    assert_equal('<p>Hello, 0!</p>', $response['body']);
}, 'php.request.sessions');

retrainer_test('logging in as 0 is allowed', function () {
    $response = handle(['method' => 'POST', 'path' => '/login', 'post' => ['user' => '0']], []);
    assert_equal(200, $response['status']);
    assert_equal('0', $response['session']['user']);
}, 'php.request.sessions');

retrainer_test('a boolean method matches nothing', function () {
    // PHP 8 still compares a bool against a string by casting the string to
    // bool, so `true == 'GET'` — and `true == 'POST'`. Only === refuses,
    // which is why every comparison in the router is strict.
    assert_equal(404, handle(['method' => true, 'path' => '/'], [])['status']);
    assert_equal(404, handle(['method' => 'GET', 'path' => true], [])['status']);
}, 'php.request.lifecycle');

retrainer_test('a boolean path cannot reach the login route', function () {
    // Reaching line 30 needs a real POST: only the path is the liar here,
    // and loose comparison would let `true` pass for '/login'.
    $response = handle(
        ['method' => 'POST', 'path' => true, 'post' => ['user' => 'ada']],
        [],
    );
    assert_equal(404, $response['status']);
}, 'php.request.lifecycle');

retrainer_test('a boolean method cannot reach the login route either', function () {
    $response = handle(
        ['method' => true, 'path' => '/login', 'post' => ['user' => 'ada']],
        [],
    );
    assert_equal(404, $response['status']);
}, 'php.request.lifecycle');

retrainer_test('a session version of zero still increments', function () {
    // ?? keeps a stored 0; ?: would read it as absent and restart the count.
    $response = handle(['method' => 'POST', 'path' => '/logout'], ['version' => 0]);
    assert_equal(['version' => 1], $response['session']);
}, 'php.request.sessions');

retrainer_test('flash reads once and removes', function () {
    [$value, $after] = session_flash(['notice' => 'saved!', 'user' => 'Ada'], 'notice');
    assert_equal('saved!', $value);
    assert_equal(['user' => 'Ada'], $after);

    [$again, $unchanged] = session_flash($after, 'notice');
    assert_equal(null, $again);
    assert_equal(['user' => 'Ada'], $unchanged);
}, 'php.request.sessions');
