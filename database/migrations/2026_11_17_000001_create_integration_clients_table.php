<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Klien integrasi = sistem lain yang memanggil API brevetlearning:
     * platform asal (aksademy, kompeten, ...) untuk mengirim peserta, dan
     * agent Cava untuk membaca/mengubah kelas. Berbeda dari `platforms`
     * (induk penerbit sertifikat yang membaca nilai).
     */
    public function up(): void
    {
        Schema::create('integration_clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('kind', 20)->default('platform'); // platform | agent
            $table->foreignUuid('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('integration_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('integration_client_id')->constrained('integration_clients')->cascadeOnDelete();
            $table->string('action', 60);
            $table->string('target_type', 60)->nullable();
            $table->string('target_id', 64)->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['integration_client_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_audit_logs');
        Schema::dropIfExists('integration_clients');
    }
};
