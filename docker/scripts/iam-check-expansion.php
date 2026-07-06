<?php

require '/fleetbase/api/vendor/autoload.php';
$app = require_once '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Fleetbase\Http\Filter\UserFilter;

echo 'hasExpansion isDriver: ' . (UserFilter::hasExpansion('isDriver') ? 'yes' : 'no') . "\n";
echo 'isExpansion is_driver: ' . (UserFilter::isExpansion('is_driver') ? 'yes' : 'no') . "\n";
echo 'isExpansion isDriver: ' . (UserFilter::isExpansion('isDriver') ? 'yes' : 'no') . "\n";
echo 'isExpansion is_customer: ' . (UserFilter::isExpansion('is_customer') ? 'yes' : 'no') . "\n";
echo 'isExpansion isCustomer: ' . (UserFilter::isExpansion('isCustomer') ? 'yes' : 'no') . "\n";

$providers = array_keys($app->getLoadedProviders());
$fleetops = array_filter($providers, fn ($p) => str_contains($p, 'FleetOps'));
echo "FleetOps providers: " . implode(', ', $fleetops) . "\n";
