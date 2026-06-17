<?php

require '/fleetbase/api/vendor/autoload.php';

$app = require '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Fleetbase\Models\EmailTemplate;

$rows = EmailTemplate::query()
    ->where('template_key', 'auth.user-credentials')
    ->whereIn('part', ['subject', 'body'])
    ->orderBy('company_uuid')
    ->orderBy('part')
    ->orderByDesc('version')
    ->get([
        'id',
        'company_uuid',
        'locale',
        'part',
        'version',
        'is_active',
        'created_at',
        'updated_at',
        'content',
    ]);

$out = [];
foreach ($rows as $row) {
    $content = (string) $row->content;
    $out[] = [
        'id' => $row->id,
        'company_uuid' => $row->company_uuid,
        'locale' => $row->locale,
        'part' => $row->part,
        'version' => $row->version,
        'is_active' => (bool) $row->is_active,
        'has_literal_h1' => str_contains($content, '<h1'),
        'has_escaped_h1' => str_contains($content, '&lt;h1'),
        'has_literal_p' => str_contains($content, '<p'),
        'has_escaped_p' => str_contains($content, '&lt;p'),
        'content_preview' => substr($content, 0, 400),
    ];
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
