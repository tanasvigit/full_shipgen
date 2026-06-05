<?php

namespace Fleetbase\Tests\Unit;

use Fleetbase\Support\InstallerMigrationPaths;
use PHPUnit\Framework\TestCase;

class InstallerMigrationPathsTest extends TestCase
{
    public function test_detects_missing_extension_migration_paths(): void
    {
        $paths = [
            '/vendor/fleetbase/core-api/migrations',
            '/vendor/fleetbase/fleetops-api/migrations',
            '/vendor/fleetbase/ledger-api/migrations',
        ];

        $missing = InstallerMigrationPaths::missingExtensionPathMarkers($paths);

        $this->assertSame(['storefront-api', 'pallet-api', 'registry-bridge'], $missing);
    }

    public function test_accepts_full_extension_migration_registration(): void
    {
        $paths = [
            '/vendor/fleetbase/core-api/migrations',
            '/vendor/fleetbase/fleetops-api/migrations',
            '/vendor/fleetbase/storefront-api/migrations',
            '/vendor/fleetbase/ledger-api/migrations',
            '/vendor/fleetbase/pallet-api/migrations',
            '/vendor/fleetbase/registry-bridge/migrations',
        ];

        $this->assertTrue(InstallerMigrationPaths::hasAllExtensionPathMarkers($paths));
        $this->assertSame([], InstallerMigrationPaths::missingExtensionPathMarkers($paths));
    }
}
