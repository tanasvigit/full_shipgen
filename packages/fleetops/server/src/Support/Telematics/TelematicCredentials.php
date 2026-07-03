<?php

namespace Fleetbase\FleetOps\Support\Telematics;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

/**
 * Read/write telematic provider credentials stored as encrypted strings or plain JSON.
 */
class TelematicCredentials
{
    public static function read(mixed $stored): array
    {
        if (is_array($stored)) {
            return $stored;
        }

        if (!is_string($stored) || $stored === '') {
            return [];
        }

        try {
            $decoded = json_decode(Crypt::decryptString($stored), true);

            return is_array($decoded) ? $decoded : [];
        } catch (DecryptException) {
            $decoded = json_decode($stored, true);

            return is_array($decoded) ? $decoded : [];
        }
    }

    public static function encrypt(array $credentials): string
    {
        return Crypt::encryptString(json_encode($credentials));
    }
}
