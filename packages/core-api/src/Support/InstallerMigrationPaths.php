<?php

namespace Fleetbase\Support;

/**
 * Guards installer migrate: iam-service must register extension package migrations
 * (storefront, ledger, pallet, registry) so first-time setup creates all microservice tables.
 */
class InstallerMigrationPaths
{
    /**
     * Vendor path fragments that must appear in migrator paths on iam-service.
     *
     * @return array<int, string>
     */
    public static function requiredExtensionPathMarkers(): array
    {
        return [
            'storefront-api',
            'ledger-api',
            'pallet-api',
            'registry-bridge',
        ];
    }

    /**
     * @param  array<int, string>  $migrationPaths
     * @return array<int, string> markers that are not represented in any path
     */
    public static function missingExtensionPathMarkers(array $migrationPaths): array
    {
        $missing = [];

        foreach (static::requiredExtensionPathMarkers() as $marker) {
            $found = false;

            foreach ($migrationPaths as $path) {
                if (str_contains($path, $marker)) {
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $missing[] = $marker;
            }
        }

        return $missing;
    }

    /**
     * @param  array<int, string>  $migrationPaths
     */
    public static function hasAllExtensionPathMarkers(array $migrationPaths): bool
    {
        return static::missingExtensionPathMarkers($migrationPaths) === [];
    }
}
