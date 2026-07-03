<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the `public_id` column to the `warranties` table.
 *
 * The Warranty model uses HasPublicId, but the original create_warranties_table
 * migration never added this column. Inserts then fail with SQLSTATE[42S22]
 * "Unknown column 'public_id'".
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('warranties') && !Schema::hasColumn('warranties', 'public_id')) {
            Schema::table('warranties', function (Blueprint $table) {
                $table->string('public_id', 191)->nullable()->unique()->index()->after('_key');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('warranties') && Schema::hasColumn('warranties', 'public_id')) {
            Schema::table('warranties', function (Blueprint $table) {
                $table->dropColumn('public_id');
            });
        }
    }
};
