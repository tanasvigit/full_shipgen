<?php

namespace Fleetbase\Mail;

/**
 * Registry of email template keys, Velocity file paths, and metadata.
 */
class EmailTemplateRegistry
{
    /** @var array<string, array<string, mixed>> */
    protected static array $templates = [];

    /** @var array<int, string> */
    protected static array $templatePaths = [];

    public static function register(string $key, array $definition): void
    {
        static::$templates[$key] = $definition;
    }

    public static function registerMany(array $templates): void
    {
        foreach ($templates as $key => $definition) {
            static::register($key, $definition);
        }
    }

    public static function addTemplatePath(string $path): void
    {
        if (!in_array($path, static::$templatePaths, true)) {
            static::$templatePaths[] = rtrim($path, DIRECTORY_SEPARATOR);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public static function get(string $key): array
    {
        static::ensureBooted();

        if (!isset(static::$templates[$key])) {
            throw new \InvalidArgumentException("Unknown email template key [{$key}].");
        }

        return static::$templates[$key];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        return static::$templates;
    }

    /**
     * @return array<int, string>
     */
    public static function templatePaths(): array
    {
        static::ensureBooted();

        return static::$templatePaths;
    }

    protected static function ensureBooted(): void
    {
        if (!empty(static::$templates)) {
            return;
        }

        static::bootDefaults();
    }

    public static function bootDefaults(): void
    {
        static::addTemplatePath(__DIR__ . '/../../email-templates');

        static::registerMany([
            'auth.verification' => [
                'subject' => 'auth/verification.subject',
                'body' => 'auth/verification.body',
                'package' => 'core-api',
                'raw_variables' => ['contentOverride'],
                'description' => 'Default email verification during onboarding or signup.',
            ],
            'auth.verification-2fa' => [
                'subject' => 'auth/verification-2fa.subject',
                'body' => 'auth/verification-2fa.body',
                'package' => 'core-api',
                'description' => 'Two-factor authentication code email.',
            ],
            'auth.user-credentials' => [
                'subject' => 'auth/user-credentials.subject',
                'body' => 'auth/user-credentials.body',
                'package' => 'core-api',
                'description' => 'Login credentials after password reset.',
            ],
            'auth.password-reset' => [
                'subject' => 'auth/password-reset.subject',
                'body' => 'auth/password-reset.body',
                'package' => 'core-api',
                'description' => 'Password reset link and code.',
            ],
            'auth.user-invited' => [
                'subject' => 'auth/user-invited.subject',
                'body' => 'auth/user-invited.body',
                'package' => 'core-api',
                'description' => 'Company invitation email.',
            ],
            'auth.user-accepted-invite' => [
                'subject' => 'auth/user-accepted-invite.subject',
                'body' => 'auth/user-accepted-invite.body',
                'package' => 'core-api',
                'description' => 'Notification when an invite is accepted.',
            ],
            'auth.user-created' => [
                'subject' => 'auth/user-created.subject',
                'body' => 'auth/user-created.body',
                'package' => 'core-api',
                'description' => 'Notification when a new user is added.',
            ],
            'auth.mail-test' => [
                'subject' => 'auth/mail-test.subject',
                'body' => 'auth/mail-test.body',
                'package' => 'core-api',
                'description' => 'SMTP configuration test email.',
            ],
            'registry.developer-verification' => [
                'subject' => 'registry/developer-verification.subject',
                'body' => 'registry/developer-verification.body',
                'package' => 'registry-bridge',
                'description' => 'Registry developer account verification.',
            ],
        ]);
    }
}
