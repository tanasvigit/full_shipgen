<?php

namespace Fleetbase\Support;

use Fleetbase\Auth\GoogleVerifier;

/**
 * Thin wrapper for Google Sign-In (uses GOOGLE_OAUTH_CLIENT_ID from env).
 */
class GoogleIdTokenVerifier
{
    public static function clientId(): ?string
    {
        $clientId = env('GOOGLE_OAUTH_CLIENT_ID');

        return is_string($clientId) && $clientId !== '' ? $clientId : null;
    }

    public static function verify(string $idToken, ?string $clientId = null): ?array
    {
        $clientId = $clientId ?: static::clientId();

        if (!$clientId) {
            return null;
        }

        return GoogleVerifier::verifyIdToken($idToken, $clientId);
    }
}
