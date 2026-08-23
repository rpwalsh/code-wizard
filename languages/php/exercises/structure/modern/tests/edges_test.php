<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('a class outside the prefix maps nowhere', function () {
    assert_equal(null, psr4_path('App\\', 'src/', 'Vendor\\Thing'));
}, 'php.structure.autoload');

retrainer_test('a top-level class under the prefix still maps', function () {
    assert_equal('src/Kernel.php', psr4_path('App\\', 'src/', 'App\\Kernel'));
}, 'php.structure.autoload');

retrainer_test('deep namespaces become deep paths', function () {
    assert_equal(
        'lib/Http/Middleware/Cors.php',
        psr4_path('Framework\\', 'lib/', 'Framework\\Http\\Middleware\\Cors')
    );
}, 'php.structure.autoload');

retrainer_test('readonly means readonly', function () {
    $channel = new EmailChannel('a@b');
    $threw = false;
    try {
        $channel->address = 'other@b';
    } catch (Error $error) {
        $threw = str_contains($error->getMessage(), 'readonly');
    }
    assert_true($threw, 'writing a readonly property is an Error');
}, 'php.structure.classes');

retrainer_test('backed enums round-trip through their values', function () {
    assert_equal(Priority::Urgent, Priority::from(3));
    assert_equal(null, Priority::tryFrom(99));
}, 'php.structure.enums');
