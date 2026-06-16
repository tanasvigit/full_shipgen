<?php

namespace Fleetbase\Mail\Concerns;

use Fleetbase\Mail\EmailTemplateRenderer;
use Fleetbase\Mail\Support\MailboxPolicy;
use Illuminate\Notifications\Messages\MailMessage;

trait RendersVelocityEmail
{
    /**
     * @param array<string, mixed> $variables
     */
    protected function velocityMail(string $templateKey, array $variables, ?string $companyUuid = null): MailMessage
    {
        $rendered = app(EmailTemplateRenderer::class)->renderMail($templateKey, $variables, $companyUuid);
        $policy = MailboxPolicy::forTemplate($templateKey);

        $mail = (new MailMessage())
            ->subject($rendered['subject'])
            ->view('fleetbase::mail.velocity', ['html' => $rendered['html']]);

        $mail->from($policy['from']->address, $policy['from']->name);
        if ($policy['replyTo']) {
            $mail->replyTo($policy['replyTo']->address, $policy['replyTo']->name);
        }

        return $mail;
    }
}
