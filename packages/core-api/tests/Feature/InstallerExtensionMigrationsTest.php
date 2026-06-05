<?php

namespace Fleetbase\Tests\Feature;

use Fleetbase\Support\InstallerMigrationPaths;
use Illuminate\Contracts\Console\Kernel;
use PHPUnit\Framework\TestCase as BaseTestCase;

/**
 * Regression guard: iam-service installer migrate must include extension schemas.
 */
class InstallerExtensionMigrationsTest extends BaseTestCase
{
    protected function createIamApplication()
    {
        putenv('FLEETBASE_SERVICE=iam');
        $_ENV['FLEETBASE_SERVICE']    = 'iam';
        $_SERVER['FLEETBASE_SERVICE'] = 'iam';

        $app = require dirname(__DIR__, 4) . '/api/bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();

        return $app;
    }

    public function test_iam_service_registers_extension_migration_paths(): void
    {
        $app     = $this->createIamApplication();
        $paths   = $app->make('migrator')->paths();
        $missing = InstallerMigrationPaths::missingExtensionPathMarkers($paths);

        $this->assertSame(
            [],
            $missing,
            'IAM installer migrate is missing extension migration paths: ' . implode(', ', $missing)
        );
    }

    public function test_iam_service_merges_storefront_database_connection_for_install(): void
    {
        $app = $this->createIamApplication();

        $this->assertSame(
            'fleetbase_storefront',
            $app->make('config')->get('database.connections.storefront.database'),
            'Storefront connection must be available on iam-service so installer migrate can create fleetbase_storefront tables.'
        );
    }
}
