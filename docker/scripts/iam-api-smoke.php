<?php

require '/fleetbase/api/vendor/autoload.php';
$app = require_once '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = $argv[1] ?? null;
$query = Fleetbase\Models\User::whereNull('deleted_at');
if ($email) {
    $query->where('email', $email);
}
$user = $query->orderBy('id')->first();
if (!$user) {
    fwrite(STDERR, "No user found\n");
    exit(1);
}

$token = $user->createToken('iam-smoke')->plainTextToken;
$company = $user->company_uuid;
echo json_encode([
    'email' => $user->email,
    'type' => $user->type,
    'company_uuid' => $company,
    'token' => $token,
], JSON_PRETTY_PRINT) . "\n";
