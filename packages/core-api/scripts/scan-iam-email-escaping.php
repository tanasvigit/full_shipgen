<?php

$roots = [
    '/fleetbase/api/vendor/fleetbase/core-api/src',
    '/fleetbase/api/vendor/fleetbase/core-api/views',
    '/fleetbase/api/app',
];

$needles = [
    'htmlspecialchars(',
    'htmlentities(',
    'htmlspecialchars_decode(',
    '{{ $html',
    '{!! $html !!}',
    '{{ $bodyContent',
    '{!! $bodyContent !!}',
];

$matches = [];

foreach ($roots as $root) {
    if (!is_dir($root)) {
        continue;
    }

    $iter = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iter as $file) {
        if (!$file->isFile()) {
            continue;
        }

        $path = $file->getPathname();
        $content = @file_get_contents($path);
        if ($content === false) {
            continue;
        }

        foreach ($needles as $needle) {
            if (str_contains($content, $needle)) {
                $matches[] = ['file' => $path, 'needle' => $needle];
            }
        }
    }
}

$out = '/fleetbase/packages/core-api/scripts/scan-iam-email-escaping.json';
file_put_contents($out, json_encode($matches, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "Wrote {$out} with " . count($matches) . " matches.\n";
