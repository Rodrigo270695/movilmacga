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
        Schema::create('geofences', function (Blueprint $table) {
            $table->id();

            // Referencia al PDV
            $table->foreignId('pdv_id')->constrained('pdvs')->onDelete('cascade')
                ->comment('PDV al que pertenece el geofence');

            // Coordenadas del centro del geofence
            $table->decimal('center_latitude', 10, 8)->comment('Latitud del centro del área');
            $table->decimal('center_longitude', 11, 8)->comment('Longitud del centro del área');

            // Radio de detección
            $table->integer('radius_meters')->default(50)->comment('Radio de detección en metros');

            // Configuración
            $table->boolean('is_active')->default(true)->comment('¿Geofence activo?');
            $table->enum('trigger_type', ['enter', 'exit', 'both'])
                ->default('enter')->comment('Tipo de activación del geofence');

            // Información adicional
            $table->text('description')->nullable()->comment('Descripción del geofence');
            $table->json('geofence_data')->nullable()->comment('Configuración adicional');

            $table->timestamps();

            // Índices para optimizar consultas geoespaciales
            $table->index(['center_latitude', 'center_longitude']);
            $table->index(['pdv_id', 'is_active']);
            $table->index('is_active');

            // Constraint: Un PDV solo puede tener un geofence activo
            $table->unique(['pdv_id', 'is_active'], 'unique_pdv_active_geofence')
                ->where('is_active', true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('geofences');
    }
};
