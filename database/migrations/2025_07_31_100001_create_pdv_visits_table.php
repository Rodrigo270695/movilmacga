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
        Schema::create('pdv_visits', function (Blueprint $table) {
            $table->id();

            // Referencias
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')
                ->comment('Usuario que realizó la visita');
            $table->foreignId('pdv_id')->constrained('pdvs')->onDelete('cascade')
                ->comment('PDV visitado');

            // Tiempos de visita
            $table->timestamp('check_in_at')->comment('Hora de llegada al PDV');
            $table->timestamp('check_out_at')->nullable()->comment('Hora de salida del PDV');

            // Ubicación real del check-in
            $table->decimal('latitude', 10, 8)->comment('Latitud real donde se hizo check-in');
            $table->decimal('longitude', 11, 8)->comment('Longitud real donde se hizo check-in');
            $table->float('distance_to_pdv')->nullable()->comment('Distancia al PDV en metros');

            // Evidencia y observaciones
            $table->text('visit_photo')->nullable()->comment('Ruta de la foto de evidencia');
            $table->text('notes')->nullable()->comment('Observaciones del vendedor durante la visita');
            $table->json('visit_data')->nullable()->comment('Datos adicionales del formulario');

            // Validación y métricas
            $table->boolean('is_valid')->default(true)->comment('¿Visita válida por el sistema?');
            $table->integer('duration_minutes')->nullable()->comment('Duración de la visita en minutos');

            // Status de la visita
            $table->enum('visit_status', ['in_progress', 'completed', 'cancelled'])
                ->default('in_progress')->comment('Estado de la visita');

            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['user_id', 'check_in_at']);
            $table->index(['pdv_id', 'check_in_at']);
            $table->index(['check_in_at', 'is_valid']);
            $table->index(['user_id', 'pdv_id', 'check_in_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdv_visits');
    }
};
