<?php

namespace Fleetbase\Mail\Concerns;

use Fleetbase\Mail\EmailTemplateRenderer;
use Fleetbase\Mail\Support\MailboxPolicy;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\Log;

trait RendersVelocityMailable
{
    /**
     * @param array<string, mixed> $variables
     *
     * @return array{subject: string, html: string}
     */
    protected function renderVelocityMail(string $templateKey, array $variables, ?string $companyUuid = null): array
    {
        return app(EmailTemplateRenderer::class)->renderMail($templateKey, $variables, $companyUuid);
    }

    /**
     * @param array<string, mixed> $variables
     */
    protected function velocityEnvelope(string $templateKey, array $variables, ?string $companyUuid = null): Envelope
    {
        $rendered = $this->renderVelocityMail($templateKey, $variables, $companyUuid);
        $policy = MailboxPolicy::forTemplate($templateKey);

        $replyTo = [];
        if ($policy['replyTo']) {
            $replyTo[] = $policy['replyTo'];
        }

        return new Envelope(
            subject: $rendered['subject'],
            from: $policy['from'],
            replyTo: $replyTo,
        );
    }

    /**
     * @param array<string, mixed> $variables
     */
    protected function velocityCredentialEnvelope(string $templateKey, array $variables, ?string $companyUuid = null): Envelope
    {
        return $this->velocityEnvelope($templateKey, $variables, $companyUuid);
    }

    /**
     * @param array<string, mixed> $variables
     */
    protected function velocityContent(string $templateKey, array $variables, ?string $companyUuid = null): Content
    {
        $rendered = $this->renderVelocityMail($templateKey, $variables, $companyUuid);
        if (filter_var(env('MAIL_TEMPLATE_DEBUG', false), FILTER_VALIDATE_BOOLEAN)) {
            Log::info('mail_template_debug_payload', [
                'template' => $templateKey,
                'service' => env('FLEETBASE_SERVICE'),
                'host' => gethostname(),
                'has_literal_h1' => str_contains($rendered['html'], '<h1'),
                'has_escaped_h1' => str_contains($rendered['html'], '&lt;h1'),
                'preview' => substr($rendered['html'], 0, 500),
            ]);
        }

        return new Content(htmlString: $rendered['html']);
    }
}
