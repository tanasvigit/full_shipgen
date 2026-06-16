<?php

/**
 * One-off: render auth.user-credentials via Velocity, dump HTML, then send.
 * Usage: php /fleetbase/packages/core-api/scripts/test-user-credentials-mail.php [recipient-email]
 */

require '/fleetbase/api/vendor/autoload.php';

$app = require '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Fleetbase\Mail\EmailTemplateRenderer;
use Fleetbase\Mail\Support\CredentialEmailBranding;
use Fleetbase\Mail\UserCredentialsMail;
use Fleetbase\Models\User;
use Illuminate\Support\Facades\Mail;

$recipientOverride = $argv[1] ?? null;

$user = User::query()->orderBy('id')->first();
if (!$user) {
    fwrite(STDERR, "No users in database.\n");
    exit(1);
}

$password = 'VelocityTest-' . date('His');
$mail = new UserCredentialsMail($password, $user);

// Prove Velocity mailable is loaded.
$mailFile = (new ReflectionClass(UserCredentialsMail::class))->getFileName();
$usesVelocity = method_exists($mail, 'velocityEnvelope') || in_array(
    'Fleetbase\Mail\Concerns\RendersVelocityMailable',
    class_uses_recursive(UserCredentialsMail::class),
    true
);

echo "=== UserCredentialsMail source ===\n";
echo $mailFile . "\n";
echo "Uses RendersVelocityMailable: " . ($usesVelocity ? 'YES' : 'NO') . "\n\n";

// Dump final HTML exactly as envelope/content would render it.
$renderer = app(EmailTemplateRenderer::class);
$rendered = $renderer->renderMail('auth.user-credentials', [
    'brandName' => CredentialEmailBranding::BRAND_NAME,
    'logoUrl' => CredentialEmailBranding::emailLogoUrl(),
    'headline' => CredentialEmailBranding::greetingHeadlineForUser($user),
    'userName' => \Fleetbase\Support\Utils::delinkify($user->name),
    'userEmail' => $user->email,
    'plaintextPassword' => $password,
    'companyName' => $user->company_name,
]);

$dumpPath = '/fleetbase/api/storage/app/user-credentials-render-dump.html';
file_put_contents($dumpPath, $rendered['html']);

echo "=== Rendered subject ===\n";
echo $rendered['subject'] . "\n\n";

echo "=== Template markers ===\n";
echo 'auth/user-credentials.body.vm gradient #0066FF: ' . (str_contains($rendered['html'], '#0066FF') ? 'YES' : 'NO') . "\n";
echo 'Old Blade shipgen-fleet footer: ' . (str_contains($rendered['html'], 'shipgen-fleet') ? 'YES' : 'NO') . "\n";
echo 'Logo URL: ' . CredentialEmailBranding::emailLogoUrl() . "\n";
echo 'Headline rendered: ' . (preg_match('/Good (Morning|Afternoon|Evening),/', $rendered['html']) ? 'YES' : 'NO') . "\n\n";

echo "=== Final HTML (first 800 chars) ===\n";
echo substr($rendered['html'], 0, 800) . "\n...\n\n";
echo "Full HTML written to: {$dumpPath}\n\n";

$recipient = $recipientOverride ?: $user->email;
echo "=== Sending test email to {$recipient} ===\n";

Mail::to($recipient)->send($mail);

echo "Sent.\n";
