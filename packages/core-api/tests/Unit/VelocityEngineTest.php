<?php

use Fleetbase\Mail\Velocity\VelocityEngine;

it('renders velocity variables and conditionals', function () {
    $engine = new VelocityEngine([__DIR__ . '/../email-templates']);

    $html = $engine->renderString(
        '<p>Hello $userName</p>#if($show)<p>Visible</p>#end',
        ['userName' => 'Ada', 'show' => true]
    );

    expect($html)->toContain('Hello Ada');
    expect($html)->toContain('Visible');
});

it('does not escape raw layout variables', function () {
    $engine = new VelocityEngine();

    $html = $engine->renderString(
        '<div class="content">$bodyContent</div>',
        ['bodyContent' => '<h1>Hello</h1>'],
        ['bodyContent']
    );

    expect($html)->toBe('<div class="content"><h1>Hello</h1></div>');
});

it('does not escape bodyContent when using render()', function () {
    $engine = new VelocityEngine();

    $html = $engine->renderString(
        '<div>$bodyContent</div>',
        ['bodyContent' => '<h1>Hello</h1>']
    );

    expect($html)->toBe('<div><h1>Hello</h1></div>');
});

it('loads registered auth verification subject template', function () {
    $engine = new VelocityEngine([__DIR__ . '/../email-templates']);

    $subject = $engine->render('auth/verification.subject', [
        'code' => '123456',
        'appName' => 'Fleetbase',
    ]);

    expect($subject)->toBe('123456 is your Fleetbase verification code');
});
