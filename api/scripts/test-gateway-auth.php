<?php

$ctx = stream_context_create([
    'http' => [
        'method'  => 'GET',
        'header'  => "X-Gateway-Internal-Secret: shipgen-gateway-dev-secret\r\nAccept: application/json\r\n",
        'ignore_errors' => true,
    ],
]);

$url      = getenv('TEST_URL') ?: 'http://127.0.0.1:8000/int/v1/gateway/auth';
$response = file_get_contents($url, false, $ctx);

echo "URL: {$url}\n";
echo "Response:\n{$response}\n";

if (isset($http_response_header)) {
    echo implode("\n", $http_response_header) . "\n";
}
