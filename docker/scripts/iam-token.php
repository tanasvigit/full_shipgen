<?php

require '/fleetbase/api/vendor/autoload.php';
$app = require_once '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = $argv[1] ?? 'balajivanasettyit@gmail.com';
$user = Fleetbase\Models\User::where('email', $email)->first();
if (!$user) {
    exit(1);
}

session(['company' => $user->company_uuid, 'user' => $user->uuid]);
echo "email={$user->email} type={$user->type} isAdmin=" . ($user->isAdmin() ? 'yes' : 'no') . "\n";
$token = $user->createToken('iam-smoke')->plainTextToken;
echo "token={$token}\n";
