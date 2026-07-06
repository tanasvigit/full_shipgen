<?php

require '/fleetbase/api/vendor/autoload.php';
$app = require_once '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = $argv[1] ?? 'balajivanasettyit@gmail.com';
$user = Fleetbase\Models\User::where('email', $email)->first();
if (!$user) {
    fwrite(STDERR, "User not found\n");
    exit(1);
}

session(['company' => $user->company_uuid, 'user' => $user->uuid]);
$token = $user->createToken('iam-filter-test')->plainTextToken;
$base = 'http://fleetbase-gateway-1/int/v1';

function apiGet(string $path, string $token): array {
    global $base;
    $ch = curl_init(rtrim($base, '/') . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$token}", 'Accept: application/json'],
    ]);
    $raw = curl_exec($ch);
    curl_close($ch);
    return json_decode($raw, true) ?: [];
}

function summarizeUsers(array $payload): array {
    $rows = $payload['users'] ?? [];
    return array_map(fn ($u) => [
        'email' => $u['email'] ?? '—',
        'type' => $u['type'] ?? '—',
        'name' => $u['name'] ?? '—',
    ], $rows);
}

echo "=== Database (company {$user->company_uuid}) ===\n";
$dbUsers = Fleetbase\Models\User::where('company_uuid', $user->company_uuid)
    ->whereNull('deleted_at')
    ->get(['email', 'type', 'name']);
foreach ($dbUsers as $u) {
    echo "  {$u->email}\t{$u->type}\n";
}

// Also company members via company_users
echo "\n=== All org members (company_users join) ===\n";
$members = Fleetbase\Models\User::whereHas('companyUsers', fn ($q) => $q->where('company_uuid', $user->company_uuid))
    ->whereNull('deleted_at')
    ->get(['email', 'type', 'name']);
foreach ($members as $u) {
    echo "  {$u->email}\t{$u->type}\n";
}

$endpoints = [
    'all' => '/users?limit=50',
    'drivers' => '/users?is_driver=1&limit=50',
    'customers' => '/users?is_customer=1&limit=50',
];

foreach ($endpoints as $label => $path) {
    $data = apiGet($path, $token);
    $rows = summarizeUsers($data);
    echo "\n=== API {$label} ({$path}) count=" . count($rows) . " total=" . ($data['meta']['total'] ?? '?') . " ===\n";
    foreach ($rows as $r) {
        echo "  {$r['email']}\t{$r['type']}\t{$r['name']}\n";
    }
}

// Validate filtering correctness
$all = summarizeUsers(apiGet('/users?limit=50', $token));
$drivers = summarizeUsers(apiGet('/users?is_driver=1&limit=50', $token));
$customers = summarizeUsers(apiGet('/users?is_customer=1&limit=50', $token));

$driverEmails = array_column($drivers, 'email');
$customerEmails = array_column($customers, 'email');
$wrongDrivers = array_filter($drivers, fn ($r) => $r['type'] !== 'driver');
$wrongCustomers = array_filter($customers, fn ($r) => $r['type'] !== 'customer');

echo "\n=== Validation ===\n";
echo 'Drivers with non-driver type: ' . (count($wrongDrivers) ? json_encode($wrongDrivers) : 'none') . "\n";
echo 'Customers with non-customer type: ' . (count($wrongCustomers) ? json_encode($wrongCustomers) : 'none') . "\n";

$overlap = array_intersect($driverEmails, $customerEmails);
echo 'Driver/customer overlap: ' . (count($overlap) ? implode(', ', $overlap) : 'none') . "\n";
