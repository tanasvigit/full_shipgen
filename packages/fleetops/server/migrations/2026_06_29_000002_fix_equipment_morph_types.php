<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const VEHICLE = 'Fleetbase\\FleetOps\\Models\\Vehicle';
    private const EQUIPMENT = 'Fleetbase\\FleetOps\\Models\\Equipment';

    public function up(): void
    {
        if (!Schema::hasTable('equipments')) {
            return;
        }

        $this->normalizeColumn('equipable_type', [
            'fleet-ops:vehicle',
            'vehicle',
            'Fleetbase\\Models\\Vehicle',
            '\\Fleetbase\\Models\\Vehicle',
        ], self::VEHICLE);

        $this->normalizeColumn('equipable_type', [
            'fleet-ops:equipment',
            'equipment',
            'Fleetbase\\Models\\Equipment',
            '\\Fleetbase\\Models\\Equipment',
        ], self::EQUIPMENT);
    }

    private function normalizeColumn(string $column, array $from, string $to): void
    {
        DB::table('equipments')
            ->whereIn($column, $from)
            ->update([$column => $to]);
    }

    public function down(): void
    {
        // Non-reversible: legacy values were invalid class names.
    }
};
