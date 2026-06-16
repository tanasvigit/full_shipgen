<?php

namespace Fleetbase\Mail\Support;

use Fleetbase\Models\Setting;
use Fleetbase\Models\User;
use Fleetbase\Support\DefaultAssets;
use Fleetbase\Support\Utils;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Support\Carbon;

class CredentialEmailBranding
{
    public const BRAND_NAME = 'Shipgen';

    public static function envelopeFrom(): Address
    {
        return new Address(
            Utils::getDefaultMailFromAddress(),
            self::BRAND_NAME
        );
    }

    public static function greetingHeadlineForUser(User $user): string
    {
        $user->loadMissing('company');
        $name = Utils::delinkify($user->name);

        return self::greetingHeadline($name, self::resolveTimezoneForUser($user));
    }

    public static function greetingHeadline(string $name, ?string $timezone = null): string
    {
        $hour = Carbon::now(self::normalizeTimezone($timezone))->hour;
        $greeting = match (true) {
            $hour < 12 => 'Good Morning',
            $hour < 18 => 'Good Afternoon',
            default => 'Good Evening',
        };

        return $greeting . ', ' . $name . '!';
    }

    public static function resolveTimezoneForUser(User $user): string
    {
        $user->loadMissing('company');

        return self::normalizeTimezone(
            $user->timezone
            ?? data_get($user, 'company.timezone')
            ?? config('app.timezone')
        );
    }

    public static function resolveTimezone(?string $userTimezone, ?string $companyTimezone = null): string
    {
        return self::normalizeTimezone(
            $userTimezone
            ?? $companyTimezone
            ?? config('app.timezone')
        );
    }

    /**
     * Public HTTPS-friendly logo URL for email clients (Gmail, Outlook).
     */
    public static function emailLogoUrl(): string
    {
        $configured = (string) config('fleetbase.branding.logo_url', '');

        if (str_starts_with($configured, 'https://')) {
            return $configured;
        }

        $logo = Setting::getBrandingLogoUrl();
        $url = DefaultAssets::resolve($logo, 'company_logo');

        return self::preferHttpsForEmail(self::rewriteAwayFromConsoleOrigin($url));
    }

    protected static function rewriteAwayFromConsoleOrigin(string $url): string
    {
        if (!str_starts_with($url, 'http')) {
            $url = DefaultAssets::resolve($url);
        }

        $consoleUrl = Utils::consoleUrl();
        $consoleParts = parse_url($consoleUrl) ?: [];
        $consoleHost = $consoleParts['host'] ?? null;
        $consolePort = $consoleParts['port'] ?? null;
        $consoleScheme = $consoleParts['scheme'] ?? 'http';

        if ($consoleHost) {
            $consoleOrigin = $consoleScheme . '://' . $consoleHost . ($consolePort ? ':' . $consolePort : '');
            if (str_starts_with($url, $consoleOrigin)) {
                $path = parse_url($url, PHP_URL_PATH) ?: '/images/logo_logistic.png';

                return self::mapLogoPathToApiAsset($path);
            }
        }

        if (preg_match('#^https?://localhost:5173#', $url)) {
            $path = parse_url($url, PHP_URL_PATH) ?: '/logo_logistic.png';

            return self::mapLogoPathToApiAsset($path);
        }

        return $url;
    }

    protected static function mapLogoPathToApiAsset(string $path): string
    {
        $path = '/' . ltrim($path, '/');

        if (str_ends_with($path, '/logo_logistic.png')) {
            $path = '/images/logo_logistic.png';
        }

        return DefaultAssets::publicBaseUrl() . $path;
    }

    protected static function preferHttpsForEmail(string $url): string
    {
        if (str_starts_with($url, 'http://') && !app()->environment(['local', 'development'])) {
            return 'https://' . substr($url, 7);
        }

        return $url;
    }

    protected static function normalizeTimezone(?string $timezone): string
    {
        $timezone = trim((string) $timezone);

        if ($timezone === '') {
            return 'UTC';
        }

        try {
            new \DateTimeZone($timezone);

            return $timezone;
        } catch (\Exception) {
            return 'UTC';
        }
    }
}
