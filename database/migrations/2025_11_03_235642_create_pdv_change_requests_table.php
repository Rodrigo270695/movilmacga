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
        Schema::create('pdv_change_requests', function (Blueprint $table) {
            $table->id();

            // Referencias
            $table->foreignId('pdv_id')->constrained('pdvs')->onDelete('cascade')
                ->comment('PDV que se solicita modificar');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')
                ->comment('Vendedor que solicita el cambio');
            $table->foreignId('zonal_id')->constrained('zonales')->onDelete('restrict')
                ->comment('Zonal del PDV (calculado automáticamente desde PDV → Route → Circuit → Zonal)');

            // Estado de la solicitud
            $table->enum('status', ['pending', 'approved', 'rejected'])
                ->default('pending')
                ->comment('Estado de la solicitud: pendiente, aprobada, rechazada');

            // Datos originales del PDV (para comparar)
            $table->json('original_data')->comment('Datos originales del PDV antes del cambio');

            // Cambios solicitados
            $table->json('changes')->comment('Datos nuevos que se solicitan cambiar');

            // Motivo y observaciones
            $table->text('reason')->nullable()->comment('Motivo del cambio solicitado por el vendedor');
            $table->text('rejection_reason')->nullable()->comment('Motivo del rechazo por parte del supervisor');

            // Timestamps de aprobación/rechazo
            $table->timestamp('approved_at')->nullable()->comment('Fecha y hora de aprobación');
            $table->timestamp('rejected_at')->nullable()->comment('Fecha y hora de rechazo');

            $table->timestamps();

            // Índices para optimizar consultas
            $table->index('status');
            $table->index('user_id');
            $table->index('zonal_id');
            $table->index('pdv_id');
            $table->index(['status', 'zonal_id']);
            $table->index(['status', 'created_at']);
            $table->index(['pdv_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdv_change_requests');
    }
};
