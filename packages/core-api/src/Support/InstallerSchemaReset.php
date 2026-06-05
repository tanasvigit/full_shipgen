<?php

namespace Fleetbase\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Prepares databases for a fresh installer migrate.
 *
 * Stale extension databases (e.g. fleetbase_storefront) can retain cross-DB foreign keys
 * that reference fleetbase.users. That breaks create_users_table on a retried install when
 * only the main DB was dropped. See carts_user_uuid_foreign on storefront carts.
 */
class InstallerSchemaReset
{
    /**
     * @param  array<int, string>  $extensionConnections
     * @return array<int, string>
     */
    public static function extensionDatabaseNames(string $mainDatabase, array $extensionConnections): array
    {
        $databases = [];

        foreach ($extensionConnections as $connection) {
            $databases[] = $mainDatabase . '_' . $connection;
        }

        return array_values(array_unique($databases));
    }

    public static function prepareFreshMigrate(): void
    {
        static::resetMainDatabaseIfCoreSchemaMissing();
        static::resetExtensionDatabasesIfCoreSchemaMissing();
    }

    public static function resetExtensionDatabasesIfCoreSchemaMissing(): void
    {
        if (Schema::hasTable('users')) {
            return;
        }

        $mainDatabase = static::mainDatabaseName();
        $charset      = config('database.connections.mysql.charset', 'utf8mb4');
        $collation    = config('database.connections.mysql.collation', 'utf8mb4_unicode_ci');
        $databases    = static::extensionDatabaseNames(
            $mainDatabase,
            Utils::fromFleetbaseExtensions('create-database')
        );

        Schema::disableForeignKeyConstraints();

        try {
            foreach ($databases as $database) {
                DB::statement("DROP DATABASE IF EXISTS `{$database}`");
                DB::statement("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET {$charset} COLLATE {$collation}");
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    public static function resetMainDatabaseIfCoreSchemaMissing(): void
    {
        if (Schema::hasTable('users')) {
            return;
        }

        if (!Schema::hasTable('migrations') && !Schema::hasTable('personal_access_tokens')) {
            return;
        }

        $database  = static::mainDatabaseName();
        $charset   = config('database.connections.mysql.charset', 'utf8mb4');
        $collation = config('database.connections.mysql.collation', 'utf8mb4_unicode_ci');

        Schema::disableForeignKeyConstraints();

        try {
            DB::statement("DROP DATABASE IF EXISTS `{$database}`");
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET {$charset} COLLATE {$collation}");
            DB::purge('mysql');
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    protected static function mainDatabaseName(): string
    {
        return config('database.connections.mysql.database') ?: env('DB_DATABASE', 'fleetbase');
    }
}
