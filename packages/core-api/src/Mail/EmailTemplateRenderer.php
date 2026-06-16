<?php

namespace Fleetbase\Mail;

use Fleetbase\Mail\Support\CredentialEmailBranding;
use Fleetbase\Mail\Velocity\VelocityEngine;
use Fleetbase\Models\EmailTemplate;
use Fleetbase\Support\Utils;
use Illuminate\Support\Arr;

class EmailTemplateRenderer
{
    protected VelocityEngine $engine;

    public function __construct(?VelocityEngine $engine = null)
    {
        $this->engine = $engine ?? new VelocityEngine(EmailTemplateRegistry::templatePaths());
    }

    /**
     * @param array<string, mixed> $variables
     *
     * @return array{subject: string, html: string}
     */
    public function renderMail(string $key, array $variables = [], ?string $companyUuid = null, ?string $locale = null): array
    {
        $definition = EmailTemplateRegistry::get($key);
        $context = $this->withGlobals($variables);

        $subjectTemplate = $this->resolveTemplateSource($key, 'subject', $definition['subject'], $companyUuid, $locale);
        $bodyTemplate = $this->resolveTemplateSource($key, 'body', $definition['body'], $companyUuid, $locale);

        $rawVariables = $definition['raw_variables'] ?? [];
        $subject = trim($this->engine->renderString($subjectTemplate, $context, $rawVariables));
        $body = trim($this->engine->renderString($bodyTemplate, $context, $rawVariables));

        if (($definition['layout'] ?? true) !== false) {
            $layout = is_string($definition['layout'] ?? null) ? $definition['layout'] : 'layouts/shipgen';
            $body = $this->engine->render($layout, array_merge($context, [
                'bodyContent' => $body,
            ]));
        }

        if (!empty($context['subjectOverride'])) {
            $subject = (string) $context['subjectOverride'];
        }

        return [
            'subject' => $subject,
            'html' => $body,
        ];
    }

    /**
     * @param array<string, mixed> $variables
     */
    public function renderPart(string $templatePath, array $variables = []): string
    {
        return $this->engine->render($templatePath, $this->withGlobals($variables));
    }

    /**
     * @param array<string, mixed> $variables
     *
     * @return array<string, mixed>
     */
    protected function withGlobals(array $variables): array
    {
        return array_merge([
            'appName' => config('app.name'),
            'brandName' => CredentialEmailBranding::BRAND_NAME,
            'year' => date('Y'),
            'logoUrl' => CredentialEmailBranding::emailLogoUrl(),
            'consoleUrl' => Utils::consoleUrl(),
            'headerTagline' => 'Command Center',
            'emailTitle' => CredentialEmailBranding::BRAND_NAME,
            'footerNote' => '',
        ], $variables);
    }

    protected function resolveTemplateSource(
        string $key,
        string $part,
        string $defaultPath,
        ?string $companyUuid,
        ?string $locale
    ): string {
        if ($companyUuid) {
            $override = EmailTemplate::query()
                ->where('template_key', $key)
                ->where('part', $part)
                ->where('company_uuid', $companyUuid)
                ->when($locale, fn ($query) => $query->where('locale', $locale))
                ->where('is_active', true)
                ->orderByDesc('version')
                ->first();

            if ($override?->content) {
                return $override->content;
            }
        }

        return $this->engine->source($defaultPath);
    }
}
