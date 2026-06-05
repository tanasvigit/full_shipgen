<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Fleetbase users are UUID-keyed; Sanctum's default morphs() bigint column is replaced here.
     */
    public function up(): void
    {
        if (config('database.default') === config('fleetbase.connection.sandbox')) {
            return;
        }

        if (Schema::hasTable('personal_access_tokens')) {
            return;
        }

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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') === config('fleetbase.connection.sandbox')) {
            return;
        }

        Schema::dropIfExists('personal_access_tokens');
    }
};
