<?php

/**
 * One-off: create first admin user (mirrors OnboardController::createAccount).
 * Run: php scripts/create-admin-user.php
 */

use Fleetbase\Events\AccountCreated;
use Fleetbase\Models\Company;
use Fleetbase\Models\User;
use Illuminate\Support\Str;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = getenv('ADMIN_EMAIL') ?: 'admin@shipgen.net';
$password = getenv('ADMIN_PASSWORD') ?: 'Shipgen@Fleet2026!';
$name = getenv('ADMIN_NAME') ?: 'Shipgen Admin';
$phone = getenv('ADMIN_PHONE') ?: '+919876543210';
$org = getenv('ADMIN_ORG') ?: 'shipgen';

if (User::exists()) {
    $existing = User::where('email', $email)->first();
    if ($existing) {
        echo "User already exists: {$email}\n";
        exit(0);
    }
    echo "Users exist but not {$email}. Create manually or set ADMIN_EMAIL.\n";
    exit(1);
}

$username = Str::slug($name . '_' . Str::random(4), '_');

$company = Company::create([
    'name' => $org,
    'onboarding_completed_at' => now(),
]);

$attributes = [
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'username' => $username,
    'timezone' => date_default_timezone_get(),
    'status' => 'active',
    'last_login' => now(),
    'company_uuid' => $company->uuid,
    'email_verified_at' => now(),
    'phone_verified_at' => now(),
];

$user = User::create($attributes);
$user->password = $password;
$user->setUserType('admin');
$user->save();

$company->setOwner($user, true)->save();
$user->assignCompany($company, 'Administrator');
$user->assignSingleRole('Administrator');

event(new AccountCreated($user, $company));

echo "Created admin user\n";
echo "  Email:    {$email}\n";
echo "  Password: {$password}\n";
echo "  Org:      {$org}\n";
