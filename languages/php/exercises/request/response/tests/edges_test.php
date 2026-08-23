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

retrainer_test('flash reads once and removes', function () {
    [$value, $after] = session_flash(['notice' => 'saved!', 'user' => 'Ada'], 'notice');
    assert_equal('saved!', $value);
    assert_equal(['user' => 'Ada'], $after);

    [$again, $unchanged] = session_flash($after, 'notice');
    assert_equal(null, $again);
    assert_equal(['user' => 'Ada'], $unchanged);
}, 'php.request.sessions');
