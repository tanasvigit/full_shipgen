<?php

require '/fleetbase/api/vendor/autoload.php';
$app = require_once '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = Fleetbase\Models\User::whereNull('deleted_at')->orderBy('id')->limit(20)->get(['email', 'type', 'uuid']);
foreach ($users as $user) {
    echo $user->email . "\t" . $user->type . "\n";
}
