<?php

namespace Fleetbase\Mail;

use Fleetbase\Mail\Support\CredentialEmailBranding;
use Fleetbase\Mail\Velocity\VelocityEngine;
use Fleetbase\Models\EmailTemplate;
use Fleetbase\Support\Utils;
use Illuminate\Database\QueryException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

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
        $this->logRenderDiagnostics($key, 'body_rendered', $body);

        if (($definition['layout'] ?? true) !== false) {
            $layout = is_string($definition['layout'] ?? null) ? $definition['layout'] : 'layouts/shipgen';
            $layoutSource = $this->engine->source($layout);
            // Inject pre-rendered HTML directly into the layout source so the body slot
            // never passes through Velocity scalar escaping.
            $layoutSource = str_replace('$bodyContent', $body, $layoutSource);
            $body = $this->engine->renderString($layoutSource, $context, $rawVariables);
            $this->logRenderDiagnostics($key, 'layout_merged', $body);
        }

        if (!empty($context['subjectOverride'])) {
            $subject = (string) $context['subjectOverride'];
        }

        return [
            'subject' => $subject,
            'html' => $body,
        ];
    }

    protected function logRenderDiagnostics(string $key, string $stage, string $html): void
    {
        if (!filter_var(env('MAIL_TEMPLATE_DEBUG', false), FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        Log::info('mail_template_debug', [
            'template' => $key,
            'stage' => $stage,
            'has_literal_h1' => str_contains($html, '<h1'),
            'has_escaped_h1' => str_contains($html, '&lt;h1'),
            'preview' => substr($html, 0, 500),
        ]);
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
            try {
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
            } catch (QueryException $e) {
                // SaaS/on-prem deployments may not run the optional email_templates migration.
                // Fall back to packaged .vm templates when company overrides storage is unavailable.
                if (str_contains($e->getMessage(), 'email_templates')) {
                    Log::warning('mail_template_override_unavailable', [
                        'template' => $key,
                        'part' => $part,
                        'company_uuid' => $companyUuid,
                    ]);
                } else {
                    throw $e;
                }
            }
        }

        return $this->engine->source($defaultPath);
    }
}
