<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Agrega índices optimizados para mejorar el rendimiento de las consultas
     * que buscan la última ubicación por usuario con filtros de fecha y mock location.
     */
    public function up(): void
    {
        Schema::table('gps_tracking', function (Blueprint $table) {
            // Índice compuesto optimizado para consultas que buscan MAX(recorded_at) por usuario
            // con filtros de fecha y mock location
            // Este índice ayuda a la subconsulta derivada que obtiene el MAX por usuario
            $table->index(['user_id', 'recorded_at', 'is_mock_location'], 'idx_user_recorded_mock');
            
            // Índice adicional para consultas que filtran por fecha y coordenadas válidas
            // Útil para el WHERE BETWEEN recorded_at y validLocation()
            $table->index(['recorded_at', 'is_mock_location', 'latitude', 'longitude'], 'idx_recorded_mock_coords');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gps_tracking', function (Blueprint $table) {
            $table->dropIndex('idx_user_recorded_mock');
            $table->dropIndex('idx_recorded_mock_coords');
        });
    }
};
