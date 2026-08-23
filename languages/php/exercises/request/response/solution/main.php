<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

function e(string $text): string
{
    // ENT_QUOTES: attributes too. Two characters long, because the safe
    // path has to be the lazy path.
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

function render_greeting(string $name): string
{
    // Escaped here, at output — storage-time escaping double-encodes on
    // the second render.
    return '<p>Hello, ' . e($name) . '!</p>';
}

function handle(array $request, array $session): array
{
    $method = $request['method'] ?? 'GET';
    $path = $request['path'] ?? '/';

    if ($method === 'GET' && $path === '/') {
        $user = $session['user'] ?? 'guest';
        return ['status' => 200, 'body' => render_greeting($user), 'session' => $session];
    }

    if ($method === 'POST' && $path === '/login') {
        $user = trim((string) ($request['post']['user'] ?? ''));
        if ($user === '') {
            return ['status' => 422, 'body' => 'who?', 'session' => $session];
        }
        // A fresh array, never a spread of the old one: carrying old keys
        // across the login boundary is the fixation bug as a data shape.
        $fresh = ['user' => $user, 'version' => ($session['version'] ?? 0) + 1];
        return ['status' => 200, 'body' => 'logged in', 'session' => $fresh];
    }

    if ($method === 'POST' && $path === '/logout') {
        return [
            'status' => 200,
            'body' => 'bye',
            'session' => ['version' => ($session['version'] ?? 0) + 1],
        ];
    }

    return ['status' => 404, 'body' => 'not found', 'session' => $session];
}

function session_flash(array $session, string $key): array
{
    // Arrays assign by copy: unset here cannot touch the caller's array,
    // and the new state travels back by return — read-once, honestly.
    $value = $session[$key] ?? null;
    unset($session[$key]);
    return [$value, $session];
}
