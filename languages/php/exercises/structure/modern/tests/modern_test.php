<?php
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)

declare(strict_types=1);

require_once __DIR__ . '/../main.php';

retrainer_test('a channel notifies, signed by the trait', function () {
    $channel = new EmailChannel('a@b');
    assert_equal('mail a@b: hello -- EmailChannel', $channel->notify('hello'));
}, 'php.structure.classes');

retrainer_test('the promoted property reads back', function () {
    assert_equal('ops@example.com', (new EmailChannel('ops@example.com'))->address);
}, 'php.structure.classes');

retrainer_test('the class honors its interface', function () {
    assert_true(new EmailChannel('a@b') instanceof Notifies, 'EmailChannel promises Notifies');
}, 'php.structure.interfaces');

retrainer_test('priorities label themselves', function () {
    assert_equal('low', Priority::Low->label());
    assert_equal('urgent', Priority::Urgent->label());
}, 'php.structure.enums');

retrainer_test('escalation climbs and saturates', function () {
    assert_equal(Priority::Normal, Priority::Low->escalate());
    assert_equal(Priority::Urgent, Priority::Normal->escalate());
    assert_equal(Priority::Urgent, Priority::Urgent->escalate());
}, 'php.structure.enums');

retrainer_test('class names map to file paths', function () {
    assert_equal('src/Mail/Sender.php', psr4_path('App\\', 'src/', 'App\\Mail\\Sender'));
}, 'php.structure.autoload');
