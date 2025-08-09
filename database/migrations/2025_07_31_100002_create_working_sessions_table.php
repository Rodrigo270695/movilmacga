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
        Schema::create('working_sessions', function (Blueprint $table) {
            $table->id();

            // Usuario de la jornada
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')
                ->comment('Usuario que realiza la jornada laboral');

            // Tiempos de jornada
            $table->timestamp('started_at')->comment('Inicio de jornada laboral');
            $table->timestamp('ended_at')->nullable()->comment('Fin de jornada laboral');

            // Ubicaciones de inicio y fin
            $table->decimal('start_latitude', 10, 8)->nullable()->comment('Latitud de inicio');
            $table->decimal('start_longitude', 11, 8)->nullable()->comment('Longitud de inicio');
            $table->decimal('end_latitude', 10, 8)->nullable()->comment('Latitud de fin');
            $table->decimal('end_longitude', 11, 8)->nullable()->comment('Longitud de fin');

            // Métricas de la jornada
            $table->float('total_distance_km')->nullable()->comment('Kilómetros totales recorridos');
            $table->integer('total_pdvs_visited')->default(0)->comment('PDVs visitados en la jornada');
            $table->integer('total_duration_minutes')->nullable()->comment('Duración total en minutos');

            // Estado de la jornada
            $table->enum('status', ['active', 'paused', 'completed', 'cancelled'])
                ->default('active')->comment('Estado de la jornada laboral');

            // Información adicional
            $table->text('notes')->nullable()->comment('Observaciones de la jornada');
            $table->json('session_data')->nullable()->comment('Datos adicionales de la sesión');

            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['user_id', 'started_at']);
            $table->index(['started_at', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('working_sessions');
    }
};
