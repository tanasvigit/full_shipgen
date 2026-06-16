<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->nullable()->index();
            $table->uuid('company_uuid')->nullable()->index();
            $table->string('template_key');
            $table->enum('part', ['subject', 'body'])->default('body');
            $table->string('locale', 12)->default('en');
            $table->string('subject')->nullable();
            $table->longText('content')->nullable();
            $table->string('description')->nullable();
            $table->json('variables_schema')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_uuid', 'template_key', 'part', 'locale', 'version'], 'email_templates_override_unique');
            $table->foreign('company_uuid')->references('uuid')->on('companies')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
