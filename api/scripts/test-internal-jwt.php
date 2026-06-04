<?php

$base = is_file('/fleetbase/api/vendor/autoload.php') ? '/fleetbase/api' : dirname(__DIR__);

require $base . '/vendor/autoload.php';

$app = require $base . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$jwt = $argv[1] ?? '';

try {
    print_r(Fleetbase\Support\InternalJwt::validate($jwt));
    echo "\nOK\n";
} catch (Throwable $e) {
    echo get_class($e) . ': ' . $e->getMessage() . "\n";
}
