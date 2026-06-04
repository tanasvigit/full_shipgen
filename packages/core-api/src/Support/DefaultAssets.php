<?php

namespace Fleetbase\Support;

/**
 * On-prem default asset URLs (no fleetbase.io / flb-assets CDN).
 */
class DefaultAssets
{
    public static function publicBaseUrl(): string
    {
        $base = config('fleetbase.assets.public_base_url');

        return rtrim((string) ($base ?: config('app.url', 'http://localhost:8000')), '/');
    }

    public static function resolve(?string $path, string $fallbackKey = 'placeholder_image'): string
    {
        if (empty($path)) {
            return static::url($fallbackKey);
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return static::publicBaseUrl() . '/' . ltrim($path, '/');
    }

    public static function url(string $key): string
    {
        return static::resolve(config("fleetbase.defaults.{$key}"), $key);
    }

    /**
     * @return array<string, string>
     */
    public static function all(): array
    {
        $keys = array_keys(config('fleetbase.defaults', []));

        return collect($keys)->mapWithKeys(fn ($key) => [$key => static::url($key)])->all();
    }
}
