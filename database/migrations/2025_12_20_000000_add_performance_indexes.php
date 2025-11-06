<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Agrega índices críticos para mejorar el rendimiento de las queries optimizadas
     */
    public function up(): void
    {
        // Índices para pdv_visits - Optimizar queries de reportes
        Schema::table('pdv_visits', function (Blueprint $table) {
            // Índice compuesto para consultas por fecha y estado
            if (!$this->indexExists('pdv_visits', 'pdv_visits_check_out_at_visit_status_index')) {
                $table->index(['check_out_at', 'visit_status'], 'pdv_visits_check_out_at_visit_status_index');
            }

            // Índice para consultas por fecha completa (crítico para reportes)
            if (!$this->indexExists('pdv_visits', 'pdv_visits_check_in_at_index')) {
                $table->index('check_in_at');
            }

            // Índice compuesto para consultas por usuario y fecha
            if (!$this->indexExists('pdv_visits', 'pdv_visits_user_id_check_in_at_index')) {
                $table->index(['user_id', 'check_in_at']);
            }

            // Índice compuesto para consultas por rango de fechas y estado (optimización adicional)
            if (!$this->indexExists('pdv_visits', 'pdv_visits_check_in_at_visit_status_index')) {
                $table->index(['check_in_at', 'visit_status'], 'pdv_visits_check_in_at_visit_status_index');
            }

            // Índice compuesto para consultas por PDV y fecha
            if (!$this->indexExists('pdv_visits', 'pdv_visits_pdv_id_check_in_at_index')) {
                $table->index(['pdv_id', 'check_in_at'], 'pdv_visits_pdv_id_check_in_at_index');
            }
        });

        // Índices para working_sessions - Optimizar reportes
        Schema::table('working_sessions', function (Blueprint $table) {
            // Índice para consultas por rango de fechas
            if (!$this->indexExists('working_sessions', 'working_sessions_started_at_status_index')) {
                $table->index(['started_at', 'status']);
            }

            // Índice para consultas por usuario y rango de fechas
            if (!$this->indexExists('working_sessions', 'working_sessions_user_id_started_at_status_index')) {
                $table->index(['user_id', 'started_at', 'status']);
            }
        });

        // Índices para route_visit_dates - Optimizar consultas de rutas
        Schema::table('route_visit_dates', function (Blueprint $table) {
            // Índice compuesto para consultas por fecha y estado
            if (!$this->indexExists('route_visit_dates', 'route_visit_dates_visit_date_is_active_index')) {
                $table->index(['visit_date', 'is_active'], 'route_visit_dates_visit_date_is_active_index');
            }

            // Índice para consultas por ruta y fecha
            if (!$this->indexExists('route_visit_dates', 'route_visit_dates_route_id_visit_date_index')) {
                $table->index(['route_id', 'visit_date']);
            }
        });

        // Índices para pdvs - Optimizar filtros y búsquedas
        Schema::table('pdvs', function (Blueprint $table) {
            // Índice compuesto para consultas por ruta y estado
            if (!$this->indexExists('pdvs', 'pdvs_route_id_status_index')) {
                $table->index(['route_id', 'status']);
            }
        });

        // Índices para routes - Optimizar consultas de rutas
        Schema::table('routes', function (Blueprint $table) {
            // Índice para consultas por circuito y estado
            if (!$this->indexExists('routes', 'routes_circuit_id_status_index')) {
                $table->index(['circuit_id', 'status']);
            }
        });

        // Índices para circuits - Optimizar filtros jerárquicos
        Schema::table('circuits', function (Blueprint $table) {
            // Índice para consultas por zonal y estado
            if (!$this->indexExists('circuits', 'circuits_zonal_id_status_index')) {
                $table->index(['zonal_id', 'status']);
            }
        });

        // Índices para zonales - Optimizar filtros jerárquicos
        Schema::table('zonales', function (Blueprint $table) {
            // Índice para consultas por negocio y estado
            if (!$this->indexExists('zonales', 'zonales_business_id_status_index')) {
                $table->index(['business_id', 'status']);
            }
        });

        // Índices para user_circuits - Optimizar consultas de usuarios
        Schema::table('user_circuits', function (Blueprint $table) {
            // Índice compuesto para consultas por usuario y estado
            if (!$this->indexExists('user_circuits', 'user_circuits_user_id_is_active_index')) {
                $table->index(['user_id', 'is_active'], 'user_circuits_user_id_is_active_index');
            }

            // Índice para consultas por circuito y estado
            if (!$this->indexExists('user_circuits', 'user_circuits_circuit_id_is_active_index')) {
                $table->index(['circuit_id', 'is_active'], 'user_circuits_circuit_id_is_active_index');
            }
        });

        // Índices para gps_tracking - Optimizar consultas de tracking
        Schema::table('gps_tracking', function (Blueprint $table) {
            // Índice compuesto para consultas por usuario y rango de fechas
            if (!$this->indexExists('gps_tracking', 'gps_tracking_user_id_recorded_at_index')) {
                $table->index(['user_id', 'recorded_at']);
            }

            // Índice para consultas por fecha (útil para reportes)
            if (!$this->indexExists('gps_tracking', 'gps_tracking_recorded_at_index')) {
                $table->index('recorded_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdv_visits', function (Blueprint $table) {
            $table->dropIndex('pdv_visits_check_out_at_visit_status_index');
            $table->dropIndex('pdv_visits_check_in_at_index');
            $table->dropIndex('pdv_visits_user_id_check_in_at_index');
            $table->dropIndex('pdv_visits_check_in_at_visit_status_index');
            $table->dropIndex('pdv_visits_pdv_id_check_in_at_index');
        });

        Schema::table('working_sessions', function (Blueprint $table) {
            $table->dropIndex('working_sessions_started_at_status_index');
            $table->dropIndex('working_sessions_user_id_started_at_status_index');
        });

        Schema::table('route_visit_dates', function (Blueprint $table) {
            $table->dropIndex('route_visit_dates_visit_date_is_active_index');
            $table->dropIndex('route_visit_dates_route_id_visit_date_index');
        });

        Schema::table('pdvs', function (Blueprint $table) {
            $table->dropIndex('pdvs_route_id_status_index');
        });

        Schema::table('routes', function (Blueprint $table) {
            $table->dropIndex('routes_circuit_id_status_index');
        });

        Schema::table('circuits', function (Blueprint $table) {
            $table->dropIndex('circuits_zonal_id_status_index');
        });

        Schema::table('zonales', function (Blueprint $table) {
            $table->dropIndex('zonales_business_id_status_index');
        });

        Schema::table('user_circuits', function (Blueprint $table) {
            $table->dropIndex('user_circuits_user_id_is_active_index');
            $table->dropIndex('user_circuits_circuit_id_is_active_index');
        });

        Schema::table('gps_tracking', function (Blueprint $table) {
            $table->dropIndex('gps_tracking_user_id_recorded_at_index');
            $table->dropIndex('gps_tracking_recorded_at_index');
        });
    }

    /**
     * Verificar si un índice existe
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();

        $result = $connection->select(
            "SELECT COUNT(*) as count FROM information_schema.statistics
             WHERE table_schema = ? AND table_name = ? AND index_name = ?",
            [$database, $table, $indexName]
        );

        return $result[0]->count > 0;
    }
};

