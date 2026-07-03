<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const VEHICLE = 'Fleetbase\\FleetOps\\Models\\Vehicle';
    private const EQUIPMENT = 'Fleetbase\\FleetOps\\Models\\Equipment';
    private const VENDOR = 'Fleetbase\\FleetOps\\Models\\Vendor';

    public function up(): void
    {
        if (!Schema::hasTable('maintenance_schedules')) {
            return;
        }

        $this->normalizeColumn('subject_type', [
            'vehicle',
            'Fleetbase\\Models\\Vehicle',
            '\\Fleetbase\\Models\\Vehicle',
        ], self::VEHICLE);

        $this->normalizeColumn('subject_type', [
            'equipment',
            'Fleetbase\\Models\\Equipment',
            '\\Fleetbase\\Models\\Equipment',
        ], self::EQUIPMENT);

        $this->normalizeColumn('default_assignee_type', [
            'vendor',
            'Fleetbase\\Models\\Vendor',
            '\\Fleetbase\\Models\\Vendor',
        ], self::VENDOR);
    }

    private function normalizeColumn(string $column, array $from, string $to): void
    {
        DB::table('maintenance_schedules')
            ->whereIn($column, $from)
            ->update([$column => $to]);
    }

    public function down(): void
    {
        // Non-reversible: legacy values were invalid class names.
    }
};
