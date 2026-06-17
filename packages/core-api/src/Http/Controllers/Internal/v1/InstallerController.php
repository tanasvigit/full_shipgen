<?php

namespace Fleetbase\Http\Controllers\Internal\v1;

use Fleetbase\Http\Controllers\Controller;
use Fleetbase\Models\Company;
use Fleetbase\Models\Setting;
use Fleetbase\Support\InstallerMigrationPaths;
use Fleetbase\Support\InstallerSchemaReset;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstallerController extends Controller
{
    protected function installerUiEnabled(): bool
    {
        return (bool) config('fleetbase.installer.ui_enabled', false);
    }

    protected function runtimeSetupEnabled(): bool
    {
        return (bool) config('fleetbase.installer.runtime_setup_enabled', false);
    }

    /**
     * Checks installation status with aggressive caching.
     *
     * @return \Illuminate\Http\Response
     */
    public function initialize()
    {
        if (!$this->installerUiEnabled()) {
            static::clearCache();

            return response()->json([
                'shouldInstall'     => false,
                'shouldOnboard'     => Company::doesntExist(),
                'defaultTheme'      => Setting::lookup('branding.default_theme', 'dark'),
                'installerEnabled'  => false,
                'runtimeSetupReady' => false,
            ])->header('Cache-Control', 'no-store, no-cache, must-revalidate');
        }

        $cacheKey = 'installer_status';
        $cacheTTL = now()->addHour(); // Cache for 1 hour

        // Try cache first
        $status = Cache::remember($cacheKey, $cacheTTL, function () {
            return $this->checkInstallationStatus();
        });

        // Do not cache in the browser — stale shouldInstall=false sends users to /auth.
        return response()->json($status + [
            'installerEnabled'  => true,
            'runtimeSetupReady' => $this->runtimeSetupEnabled(),
        ])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('X-Cache-Status', Cache::has($cacheKey) ? 'HIT' : 'MISS');
    }

    /**
     * Check installation status.
     */
    protected function checkInstallationStatus(): array
    {
        $shouldInstall = false;
        $shouldOnboard = false;
        $defaultTheme  = 'dark'; // Default fallback

        try {
            // Quick connection check
            DB::connection()->getPdo();

            if (!DB::connection()->getDatabaseName()) {
                $shouldInstall = true;
            } elseif ($this->needsInstallationOrMigrations()) {
                $shouldInstall = true;
            } else {
                // Use exists() instead of count() - much faster
                $shouldOnboard = !DB::table('companies')->exists();

                // Only lookup theme if not installing
                if (!$shouldInstall) {
                    $defaultTheme = Setting::lookup('branding.default_theme', 'dark');
                }
            }
        } catch (\Exception $e) {
            $shouldInstall = true;
        }

        return [
            'shouldInstall' => $shouldInstall,
            'shouldOnboard' => $shouldOnboard,
            'defaultTheme'  => $defaultTheme,
        ];
    }

    /**
     * True when schema is missing or Laravel has pending migrations.
     */
    protected function needsInstallationOrMigrations(): bool
    {
        if (!Schema::hasTable('migrations')) {
            return true;
        }

        if ($this->hasPendingMigrations()) {
            return true;
        }

        return !Schema::hasTable('companies');
    }

    /**
     * @return bool whether any registered migration has not been run on the default connection
     */
    protected function hasPendingMigrations(): bool
    {
        /** @var Migrator $migrator */
        $migrator = app('migrator');
        $paths    = $migrator->paths();

        if (empty($paths)) {
            return false;
        }

        $files = $migrator->getMigrationFiles($paths);

        if (empty($files)) {
            return false;
        }

        $ran = DB::table(config('database.migrations', 'migrations'))->pluck('migration')->all();

        return count(array_diff(array_keys($files), $ran)) > 0;
    }

    /**
     * Clear installer cache (call after installation/onboarding).
     *
     * @return void
     */
    public static function clearCache()
    {
        Cache::forget('installer_status');
    }

    public function createDatabase()
    {
        if (!$this->runtimeSetupEnabled()) {
            return response()->json([
                'status' => 'error',
                'error'  => 'Runtime database setup from the UI is disabled. Run database provisioning during deployment.',
            ], 403);
        }

        ini_set('memory_limit', '-1');
        ini_set('max_execution_time', 0);

        Artisan::call('mysql:createdb');

        InstallerSchemaReset::prepareFreshMigrate();

        // Clear cache after database creation
        static::clearCache();

        return response()->json(
            [
                'status' => 'success',
            ]
        );
    }

    public function migrate()
    {
        if (!$this->runtimeSetupEnabled()) {
            return response()->json([
                'status' => 'error',
                'error'  => 'Runtime migrations from the UI are disabled. Run migrations during deployment.',
            ], 403);
        }

        ini_set('memory_limit', '-1');
        ini_set('max_execution_time', 0);

        InstallerSchemaReset::prepareFreshMigrate();

        // Core, FleetOps, and extension schemas (storefront, ledger, pallet, registry) register
        // migrations on iam-service so a single migrate prepares all microservice databases.
        $missingExtensionPaths = InstallerMigrationPaths::missingExtensionPathMarkers(
            app('migrator')->paths()
        );

        if ($missingExtensionPaths !== []) {
            return response()->json([
                'status' => 'error',
                'error'  => 'Installer migrate is missing extension schemas: ' . implode(', ', $missingExtensionPaths)
                    . '. Rebuild api vendor packages (composer install) and retry.',
            ], 500);
        }

        Artisan::call('migrate', ['--force' => true]);
        Artisan::call('sandbox:migrate', ['--force' => true]);

        // Clear cache after migration
        static::clearCache();

        return response()->json(
            [
                'status' => 'success',
            ]
        );
    }

    public function seed()
    {
        if (!$this->runtimeSetupEnabled()) {
            return response()->json([
                'status' => 'error',
                'error'  => 'Runtime seeding from the UI is disabled. Run seeders during deployment.',
            ], 403);
        }

        ini_set('memory_limit', '-1');
        ini_set('max_execution_time', 0);

        Artisan::call('fleetbase:seed');

        // Clear cache after seeding
        static::clearCache();

        return response()->json(
            [
                'status' => 'success',
            ]
        );
    }
}
