<?php

require '/fleetbase/api/vendor/autoload.php';

$app = require '/fleetbase/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Fleetbase\Mail\Support\MailboxPolicy;
use Illuminate\Support\Facades\Mail;

$recipient = $argv[1] ?? 'tarunsai7032@gmail.com';
$tests = [
    'auth.user-invited',      // sales (exact mapping)
    'billing.invoice-test',   // billing (prefix mapping)
    'auth.user-credentials',  // noreply (prefix mapping, no reply)
    'support.inquiry-test',   // support (default mailbox fallback)
];

foreach ($tests as $templateKey) {
    $policy = MailboxPolicy::forTemplate($templateKey);

    Mail::raw("Mailbox routing test for {$templateKey}", function ($mail) use ($recipient, $policy, $templateKey) {
        $mail->to($recipient)
            ->subject("Shipgen mailbox test: {$templateKey}")
            ->from($policy['from']->address, $policy['from']->name);

        if ($policy['replyTo']) {
            $mail->replyTo($policy['replyTo']->address, $policy['replyTo']->name);
        }
    });

    echo "{$templateKey} => from={$policy['from']->address}, replyTo=" . ($policy['replyTo']?->address ?? 'none') . PHP_EOL;
}
