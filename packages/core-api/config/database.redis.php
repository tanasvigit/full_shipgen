<?php

$redis_host = env('REDIS_HOST', '127.0.0.1');
$redis_database = (int) env('REDIS_DATABASE', 0);
$redis_password = env('REDIS_PASSWORD', null);
$cacheUrl = getenv('CACHE_URL') ?: getenv('REDIS_URL');

if ($cacheUrl) {
    $url = parse_url($cacheUrl);

    if (is_array($url)) {
        if (isset($url['host'])) {
            $redis_host = $url['host'];
        }
        if (isset($url['pass'])) {
            $redis_password = $url['pass'];
        }
        $pathDb = isset($url['path']) ? ltrim($url['path'], '/') : '';
        if (is_numeric($pathDb)) {
            $redis_database = (int) $pathDb;
        }
    }
}

/*
|--------------------------------------------------------------------------
| Redis Databases
|--------------------------------------------------------------------------
|
| Redis is an open source, fast, and advanced key-value store that also
| provides a richer body of commands than a typical key-value system
| such as APC or Memcached. Laravel makes it easy to dig right in.
|
*/
return [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', \Illuminate\Support\Str::slug(env('APP_NAME', 'fleetbase'), '_') . '_database_'),
    ],

    'default' => [
        'url' => $cacheUrl,
        'host' => $redis_host,
        'password' => $redis_password,
        'port' => env('REDIS_PORT', 6379),
        'database' => $redis_database,
    ],

    'sql' => [
        'url' => $cacheUrl,
        'host' => $redis_host,
        'password' => $redis_password,
        'port' => env('REDIS_PORT', 6379),
        'database' => $redis_database + 1,
    ],

    'cache' => [
        'url' => $cacheUrl,
        'host' => $redis_host,
        'password' => $redis_password,
        'port' => env('REDIS_PORT', 6379),
        'database' => $redis_database + 2,
    ],

    'geocode-cache' => [
        'url' => $cacheUrl,
        'host' => $redis_host,
        'password' => $redis_password,
        'port' => env('REDIS_PORT', 6379),
        'database' => $redis_database + 3,
    ],
];
