<?php

namespace Fleetbase\Console\Commands;

use Fleetbase\Support\Utils;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreateDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mysql:createdb {--schemaName=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new mysql database schema based on the database config file';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $schemaNameOption   = $this->option('schemaName');
        $connections        = ['mysql', 'sandbox'];
        $packageConnections = Utils::fromFleetbaseExtensions('create-database');

        if (is_array($packageConnections) && !empty($packageConnections)) {
            $connections = array_merge($connections, $packageConnections);
        }

        $bootstrapConnection = $this->bootstrapConnectionName();

        foreach (array_unique($connections) as $connection) {
            $schemaName = $this->resolveSchemaName($connection, $schemaNameOption);

            if (empty($schemaName)) {
                $this->error("Database name is missing for connection [{$connection}]. Set DB_DATABASE or DATABASE_URL.");

                return Command::FAILURE;
            }

            $charset   = $this->connectionConfig($connection, 'charset', 'utf8mb4');
            $collation = $this->connectionConfig($connection, 'collation', 'utf8mb4_unicode_ci');
            $configKey = $this->databaseConfigKey($connection);
            $previous  = config($configKey);

            config([$configKey => null]);
            DB::purge($bootstrapConnection);

            try {
                DB::connection($bootstrapConnection)->statement(
                    "CREATE DATABASE IF NOT EXISTS `{$schemaName}` CHARACTER SET {$charset} COLLATE {$collation}"
                );
            } finally {
                config([$configKey => $previous ?: $schemaName]);
                DB::purge($bootstrapConnection);
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Resolve the schema name for a connection (never return empty when env is configured).
     */
    protected function resolveSchemaName(string $connection, ?string $schemaNameOption): string
    {
        if ($schemaNameOption) {
            return $connection === 'mysql'
                ? $schemaNameOption
                : $schemaNameOption . '_' . $connection;
        }

        $schemaName = config("database.connections.{$connection}.database");

        if (!empty($schemaName)) {
            return $schemaName;
        }

        $main = env('DB_DATABASE');

        if (empty($main)) {
            $databaseUrl = getenv('DATABASE_URL');

            if (!empty($databaseUrl)) {
                $url  = Utils::parseUrl($databaseUrl);
                $main = isset($url['path']) ? ltrim((string) $url['path'], '/') : null;
            }
        }

        $main = $main ?: 'fleetbase';

        if ($connection === 'sandbox') {
            return $main . '_sandbox';
        }

        if ($connection !== 'mysql') {
            return $main . '_' . $connection;
        }

        return $main;
    }

    /**
     * Connection used to run CREATE DATABASE (must exist in database.connections).
     */
    protected function bootstrapConnectionName(): string
    {
        if (config('database.connections.mysql.driver')) {
            return 'mysql';
        }

        $default = config('database.default', 'mysql');

        if (config("database.connections.{$default}.driver")) {
            return $default;
        }

        return 'mysql';
    }

    protected function databaseConfigKey(string $connection): string
    {
        if (config("database.connections.{$connection}.driver")) {
            return "database.connections.{$connection}.database";
        }

        return 'database.connections.mysql.database';
    }

    protected function connectionConfig(string $connection, string $key, mixed $default): mixed
    {
        if (config("database.connections.{$connection}.driver")) {
            return config("database.connections.{$connection}.{$key}", $default);
        }

        return config("database.connections.mysql.{$key}", $default);
    }
}
