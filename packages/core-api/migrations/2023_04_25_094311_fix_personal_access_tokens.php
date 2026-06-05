<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\PersonalAccessToken;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (config('database.default') === config('fleetbase.connection.sandbox')) {
            return;
        }

        if (!Schema::hasTable('personal_access_tokens') || !Schema::hasColumn('personal_access_tokens', 'tokenable_id')) {
            return;
        }

        $column = collect(\Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM `personal_access_tokens` WHERE Field = 'tokenable_id'"))->first();

        if (!$column || !str_contains(strtolower((string) $column->Type), 'bigint')) {
            return;
        }

        Schema::disableForeignKeyConstraints();

        try {
            PersonalAccessToken::query()->delete();

            Schema::table('personal_access_tokens', function (Blueprint $table) {
                $table->uuid('tokenable_id')->change();
            });
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (config('database.default') === config('fleetbase.connection.sandbox')) {
            return;
        }

        if (!Schema::hasTable('personal_access_tokens') || !Schema::hasColumn('personal_access_tokens', 'tokenable_id')) {
            return;
        }

        PersonalAccessToken::truncate();
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->bigInteger('tokenable_id')->change();
        });
    }
};
