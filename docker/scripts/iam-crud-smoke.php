<?php

$base = getenv('API_BASE') ?: 'http://fleetbase-gateway-1/int/v1';
$token = $argv[1] ?? '';
if (!$token) exit(1);

function req(string $method, string $path, ?array $body = null): array {
    global $base, $token;
    $url = rtrim($base, '/') . $path;
    $ch = curl_init($url);
    $headers = ['Accept: application/json', 'Authorization: Bearer ' . $token];
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'json' => json_decode($raw, true), 'raw' => $raw];
}

function line(string $label, array $res): void {
    $ok = $res['status'] >= 200 && $res['status'] < 300;
    echo ($ok ? 'OK ' : 'FAIL ') . $res['status'] . ' ' . $label;
    if (!$ok) echo ' ' . substr($res['raw'], 0, 300);
    echo "\n";
}

$suffix = substr((string) time(), -6);

// Roles CRUD
$createRole = req('POST', '/roles', ['role' => ['name' => "QA Role {$suffix}", 'description' => 'smoke']]);
line('create role', $createRole);
$roleId = $createRole['json']['role']['uuid'] ?? $createRole['json']['role']['id'] ?? null;

if ($roleId) {
    line('get role', req('GET', "/roles/{$roleId}"));
    line('patch role', req('PATCH', "/roles/{$roleId}", ['role' => ['description' => 'updated']]));
    line('delete role', req('DELETE', "/roles/{$roleId}"));
}

// Policies CRUD
$createPolicy = req('POST', '/policies', ['policy' => ['name' => "QA Policy {$suffix}", 'description' => 'smoke']]);
line('create policy', $createPolicy);
$policyId = $createPolicy['json']['policy']['uuid'] ?? $createPolicy['json']['policy']['id'] ?? null;
if ($policyId) {
    line('get policy', req('GET', "/policies/{$policyId}"));
    line('patch policy', req('PATCH', "/policies/{$policyId}", ['policy' => ['description' => 'updated']]));
    line('delete policy', req('DELETE', "/policies/{$policyId}"));
}

// Groups CRUD
$createGroup = req('POST', '/groups', ['group' => ['name' => "QA Group {$suffix}", 'description' => 'smoke', 'users' => []]]);
line('create group', $createGroup);
$groupId = $createGroup['json']['group']['uuid'] ?? $createGroup['json']['group']['id'] ?? null;
if ($groupId) {
    line('get group', req('GET', "/groups/{$groupId}"));
    line('patch group', req('PATCH', "/groups/{$groupId}", ['group' => ['description' => 'updated', 'users' => []]]));
    line('delete group', req('DELETE', "/groups/{$groupId}"));
}

// Users list filters
line('users drivers filter', req('GET', '/users?is_driver=1&limit=5'));
line('users customers filter', req('GET', '/users?is_customer=1&limit=5'));
