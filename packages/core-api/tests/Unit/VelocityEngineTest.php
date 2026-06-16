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

it('loads registered auth verification subject template', function () {
    $engine = new VelocityEngine([__DIR__ . '/../email-templates']);

    $subject = $engine->render('auth/verification.subject', [
        'code' => '123456',
        'appName' => 'Fleetbase',
    ]);

    expect($subject)->toBe('123456 is your Fleetbase verification code');
});
