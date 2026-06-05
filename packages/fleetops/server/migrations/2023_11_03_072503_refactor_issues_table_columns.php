<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Avoid Doctrine DBAL introspection on POINT columns in this table.
        Schema::table('issues', function (Blueprint $table) {
            $table->dropColumn(['longitude', 'latitude', 'odometer']);
            $table->string('category')->nullable()->after('type');
            $table->json('tags')->nullable()->after('priority');
            $table->json('meta')->nullable()->after('priority');
            $table->foreignUuid('reported_by_uuid')->nullable()->after('assigned_to_uuid')->references('uuid')->on('users')->onDelete('cascade');
        });

        DB::statement('ALTER TABLE `issues` MODIFY `report` MEDIUMTEXT NULL');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->string('longitude')->nullable()->after('location');
            $table->string('latitude')->nullable()->after('location');
            $table->string('odometer')->nullable()->after('location');
            $table->dropForeign(['reported_by_uuid']);
            $table->dropColumn(['reported_by_uuid', 'meta', 'tags', 'category']);
        });

        DB::statement('ALTER TABLE `issues` MODIFY `report` VARCHAR(255) NULL');
    }
};
