<?php

$base = getenv('API_BASE') ?: 'http://fleetbase-gateway-1/int/v1';
$token = $argv[1] ?? '';
if (!$token) {
    fwrite(STDERR, "Usage: php iam-smoke-http.php <token>\n");
    exit(1);
}

function req(string $method, string $path, ?array $body = null): array {
    global $base, $token;
    $url = rtrim($base, '/') . $path;
    $ch = curl_init($url);
    $headers = [
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ];
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'body' => json_decode($raw, true), 'raw' => $raw];
}

$tests = [
    ['GET', '/users', null],
    ['GET', '/users?is_driver=1', null],
    ['GET', '/users?is_customer=1', null],
    ['GET', '/roles', null],
    ['GET', '/policies', null],
    ['GET', '/groups', null],
    ['GET', '/permissions', null],
];

foreach ($tests as [$method, $path, $body]) {
    $res = req($method, $path, $body);
    $ok = $res['status'] >= 200 && $res['status'] < 300;
    echo ($ok ? 'OK ' : 'FAIL ') . $res['status'] . ' ' . $method . ' ' . $path;
    if (!$ok) {
        echo ' ' . substr($res['raw'], 0, 200);
    } else {
        $keys = array_keys((array) ($res['body'] ?? []));
        echo ' keys=' . implode(',', array_slice($keys, 0, 5));
    }
    echo "\n";
}
