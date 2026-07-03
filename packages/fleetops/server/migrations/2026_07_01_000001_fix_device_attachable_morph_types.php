<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const VEHICLE = 'Fleetbase\\FleetOps\\Models\\Vehicle';
    private const ASSET = 'Fleetbase\\FleetOps\\Models\\Asset';
    private const DRIVER = 'Fleetbase\\FleetOps\\Models\\Driver';
    private const CONTACT = 'Fleetbase\\FleetOps\\Models\\Contact';

    public function up(): void
    {
        if (!Schema::hasTable('devices') || !Schema::hasColumn('devices', 'attachable_type')) {
            return;
        }

        $this->normalize('attachable_type', [
            'fleet-ops:vehicle',
            'vehicle',
            'Fleetbase\\Models\\Vehicle',
            '\\Fleetbase\\Models\\Vehicle',
        ], self::VEHICLE);

        $this->normalize('attachable_type', [
            'fleet-ops:asset',
            'asset',
            'Fleetbase\\Models\\Asset',
            '\\Fleetbase\\Models\\Asset',
        ], self::ASSET);

        $this->normalize('attachable_type', [
            'fleet-ops:driver',
            'driver',
            'Fleetbase\\Models\\Driver',
            '\\Fleetbase\\Models\\Driver',
        ], self::DRIVER);

        $this->normalize('attachable_type', [
            'fleet-ops:contact',
            'contact',
            'Fleetbase\\Models\\Contact',
            '\\Fleetbase\\Models\\Contact',
        ], self::CONTACT);
    }

    private function normalize(string $column, array $from, string $to): void
    {
        DB::table('devices')
            ->whereIn($column, $from)
            ->update([$column => $to]);
    }

    public function down(): void
    {
        // Non-reversible: legacy values were invalid class names.
    }
};
