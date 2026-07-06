<?php
require '/fleetbase/api/vendor/autoload.php';
$app = require_once '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo 'Driver class: ' . (class_exists(\Fleetbase\FleetOps\Models\Driver::class) ? 'yes' : 'no') . "\n";
$u = new Fleetbase\Models\User();
echo 'driverProfiles method: ' . (method_exists($u, 'driverProfiles') ? 'yes' : 'no') . "\n";
echo 'FleetOps provider: ' . (class_exists(\Fleetbase\FleetOps\Providers\FleetOpsServiceProvider::class) ? 'yes' : 'no') . "\n";
