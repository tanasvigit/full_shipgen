<?php

require '/fleetbase/api/vendor/autoload.php';

$app = require '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Fleetbase\Mail\EmailTemplateRenderer;
use Fleetbase\Mail\EmailTemplateRegistry;
use Fleetbase\Mail\UserCredentialsMail;
use Fleetbase\Mail\Velocity\VelocityEngine;
use Fleetbase\Models\User;
use Fleetbase\Support\Utils;

$user = User::query()->orderBy('id')->first();
if (!$user) {
    fwrite(STDERR, "No users found.\n");
    exit(1);
}

$password = 'Diag-' . date('His');
$templateKey = 'auth.user-credentials';

$variables = [
    'brandName' => 'Shipgen',
    'headerTagline' => 'Command Center · Secure Access',
    'logoUrl' => config('fleetbase.branding.logo_url', '/images/logo_logistic.png'),
    'headline' => 'Good Afternoon, ' . Utils::delinkify($user->name) . '!',
    'userName' => Utils::delinkify($user->name),
    'userEmail' => $user->email,
    'plaintextPassword' => $password,
    'companyName' => $user->company_name,
];

$renderer = app(EmailTemplateRenderer::class);
$engine = new VelocityEngine(EmailTemplateRegistry::templatePaths());
$definition = EmailTemplateRegistry::get($templateKey);

$globals = (function (array $vars): array {
    return array_merge([
        'appName' => config('app.name'),
        'brandName' => 'Shipgen',
        'year' => date('Y'),
        'logoUrl' => config('fleetbase.branding.logo_url', '/images/logo_logistic.png'),
        'consoleUrl' => Utils::consoleUrl(),
        'headerTagline' => 'Command Center',
        'emailTitle' => 'Shipgen',
        'footerNote' => '',
    ], $vars);
})->bindTo($renderer, $renderer)($variables);

$bodyTemplateSource = $engine->source($definition['body']);
$rawVariables = $definition['raw_variables'] ?? [];
$renderedBody = trim($engine->renderString($bodyTemplateSource, $globals, $rawVariables));

$layout = is_string($definition['layout'] ?? null) ? $definition['layout'] : 'layouts/shipgen';
$layoutSource = $engine->source($layout);
$layoutSource = str_replace('$bodyContent', $renderedBody, $layoutSource);
$finalHtml = $engine->renderString($layoutSource, $globals, $rawVariables);

$mailable = new UserCredentialsMail($password, $user);
$payloadHtml = $mailable->render();

$dump = [
    'template' => $templateKey,
    'user' => ['id' => $user->id, 'email' => $user->email],
    'checks' => [
        'raw_body_template_has_h1' => str_contains($bodyTemplateSource, '<h1'),
        'rendered_body_has_literal_h1' => str_contains($renderedBody, '<h1'),
        'rendered_body_has_escaped_h1' => str_contains($renderedBody, '&lt;h1'),
        'final_html_has_literal_h1' => str_contains($finalHtml, '<h1'),
        'final_html_has_escaped_h1' => str_contains($finalHtml, '&lt;h1'),
        'mailable_payload_has_literal_h1' => str_contains($payloadHtml, '<h1'),
        'mailable_payload_has_escaped_h1' => str_contains($payloadHtml, '&lt;h1'),
        'mailable_payload_contains_raw_html_text' => str_contains($payloadHtml, '<h1 style='),
    ],
    'raw_body_template_source' => $bodyTemplateSource,
    'body_content_before_layout_merge' => $renderedBody,
    'final_html_after_layout_render' => $finalHtml,
    'exact_html_payload_from_mailable_render' => $payloadHtml,
];

$out = '/fleetbase/packages/core-api/scripts/diagnose-user-credentials-pipeline.json';
file_put_contents($out, json_encode($dump, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo "Diagnostic written: {$out}\n";
echo json_encode($dump['checks'], JSON_PRETTY_PRINT) . "\n";
