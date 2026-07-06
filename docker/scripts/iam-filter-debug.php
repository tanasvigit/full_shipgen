<?php

require '/fleetbase/api/vendor/autoload.php';
$app = require_once '/fleetbase/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Fleetbase\Models\User;
use Fleetbase\Http\Filter\UserFilter;
use Illuminate\Http\Request;

$email = $argv[1] ?? 'balajivanasettyit@gmail.com';
$admin = Fleetbase\Models\User::where('email', $email)->first();
session(['company' => $admin->company_uuid, 'user' => $admin->uuid]);

function runFilter(array $query): array {
    $request = Request::create('/int/v1/users', 'GET', $query);
    $request->setLaravelSession(app('session.store'));
    $builder = User::query();
    (new UserFilter($request))->apply($builder);
    return $builder->pluck('email')->all();
}

echo "all: " . implode(', ', runFilter(['limit' => 50])) . "\n";
echo "is_driver=1: " . implode(', ', runFilter(['is_driver' => 1, 'limit' => 50])) . "\n";
echo "is_customer=1: " . implode(', ', runFilter(['is_customer' => 1, 'limit' => 50])) . "\n";

// Debug applyFilter path
$request = Request::create('/int/v1/users', 'GET', ['is_driver' => 1]);
$request->setLaravelSession(app('session.store'));
$filter = new UserFilter($request);
$builder = User::query();
$filter->apply($builder);
echo "SQL: " . $builder->toSql() . "\n";
echo "bindings: " . json_encode($builder->getBindings()) . "\n";
