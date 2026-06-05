<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Repair installs where alter migrations ran before the Sanctum create migration.
     */
    public function up(): void
    {
        if (config('database.default') === config('fleetbase.connection.sandbox')) {
            return;
        }

        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->uuidMorphs('tokenable');
                $table->string('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });

            return;
        }

        if (!Schema::hasColumn('personal_access_tokens', 'expires_at')) {
            Schema::table('personal_access_tokens', function (Blueprint $table) {
                $table->timestamp('expires_at')->nullable()->after('last_used_at');
            });
        }

        $column = collect(DB::select("SHOW COLUMNS FROM `personal_access_tokens` WHERE Field = 'tokenable_id'"))->first();

        if ($column && str_contains(strtolower((string) $column->Type), 'bigint')) {
            Schema::disableForeignKeyConstraints();

            try {
                DB::table('personal_access_tokens')->delete();

                Schema::table('personal_access_tokens', function (Blueprint $table) {
                    $table->uuid('tokenable_id')->change();
                });
            } finally {
                Schema::enableForeignKeyConstraints();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive repair migration.
    }
};
