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
        Schema::table('businesses', function (Blueprint $table) {
            // Distancia máxima (en metros) a la que un vendedor puede estar del
            // PDV para iniciar/registrar una visita. Antes era un valor fijo de
            // 20m en el código de la app móvil; ahora es configurable por negocio.
            $table->unsignedInteger('max_visit_distance_meters')->default(20)->after('status');

            // Tiempo mínimo (en minutos) que debe transcurrir desde el check-in
            // antes de permitir finalizar (check-out) la visita.
            $table->unsignedInteger('min_visit_duration_minutes')->default(10)->after('max_visit_distance_meters');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['max_visit_distance_meters', 'min_visit_duration_minutes']);
        });
    }
};
