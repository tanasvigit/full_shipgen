<?php

namespace Fleetbase\Http\Controllers\Internal\v1;

use Fleetbase\Http\Controllers\Controller;
use Fleetbase\Models\Setting;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstallerController extends Controller
{
    /**
     * Checks installation status with aggressive caching.
     *
     * @return \Illuminate\Http\Response
     */
    public function initialize()
    {
        $cacheKey = 'installer_status';
        $cacheTTL = now()->addHour(); // Cache for 1 hour

        // Try cache first
        $status = Cache::remember($cacheKey, $cacheTTL, function () {
            return $this->checkInstallationStatus();
        });

        // Do not cache in the browser — stale shouldInstall=false sends users to /auth.
        return response()->json($status)
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

    /**
     * Drop extension databases left from a partial install (e.g. storefront FKs before core users).
     * Skipped when core schema already exists so production re-runs are unaffected.
     */
    protected function resetExtensionDatabasesIfCoreSchemaMissing(): void
    {
        if (Schema::hasTable('users')) {
            return;
        }

        $storefrontDatabase = config('database.connections.storefront.database');

        if (empty($storefrontDatabase) || !config('database.connections.storefront.driver')) {
            return;
        }

        $charset   = config('database.connections.storefront.charset', 'utf8mb4');
        $collation = config('database.connections.storefront.collation', 'utf8mb4_unicode_ci');

        Schema::disableForeignKeyConstraints();

        try {
            DB::statement("DROP DATABASE IF EXISTS `{$storefrontDatabase}`");
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$storefrontDatabase}` CHARACTER SET {$charset} COLLATE {$collation}");
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    public function createDatabase()
    {
        ini_set('memory_limit', '-1');
        ini_set('max_execution_time', 0);

        Artisan::call('mysql:createdb');

        $this->resetExtensionDatabasesIfCoreSchemaMissing();

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
        ini_set('memory_limit', '-1');
        ini_set('max_execution_time', 0);

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
