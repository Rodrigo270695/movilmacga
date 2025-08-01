<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('zonal_supervisors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zonal_id')->constrained('zonales')->onDelete('cascade')
                ->comment('Zonal asignado al supervisor');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')
                ->comment('Usuario supervisor asignado');
            $table->timestamp('assigned_at')->useCurrent()->comment('Fecha y hora de asignación');
            $table->boolean('is_active')->default(true)->comment('Estado de la asignación');
            $table->text('notes')->nullable()->comment('Observaciones de la asignación');
            $table->json('assignment_data')->nullable()->comment('Datos adicionales de la asignación');
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['zonal_id', 'is_active']);
            $table->index(['user_id', 'is_active']);

            // Un zonal solo puede tener un supervisor activo
            $table->unique(['zonal_id', 'is_active'], 'unique_active_zonal_supervisor')
                ->where('is_active', true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zonal_supervisors');
    }
};