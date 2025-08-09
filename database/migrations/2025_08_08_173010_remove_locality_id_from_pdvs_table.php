<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * ADVERTENCIA: Esta migración elimina la columna locality_id.
     * Solo ejecutar cuando estés 100% seguro de que las nuevas columnas
     * district_id y locality funcionan correctamente.
     */
    public function up(): void
    {
        Schema::table('pdvs', function (Blueprint $table) {
            // Eliminar foreign key constraint
            $table->dropForeign(['locality_id']);

            // Eliminar índices que incluyen locality_id
            $table->dropIndex(['locality_id', 'status']);

            // Eliminar la columna locality_id
            $table->dropColumn('locality_id');
        });

        echo "Columna locality_id eliminada exitosamente." . PHP_EOL;
        echo "IMPORTANTE: Esta acción no es reversible sin backup." . PHP_EOL;
    }

    /**
     * Reverse the migrations.
     *
     * ADVERTENCIA: El rollback de esta migración restaurará la estructura
     * pero NO los datos. Necesitarás un backup para restaurar los datos.
     */
    public function down(): void
    {
        Schema::table('pdvs', function (Blueprint $table) {
            // Recrear la columna locality_id
            $table->foreignId('locality_id')->nullable()->after('longitude');

            // Recrear foreign key constraint
            $table->foreign('locality_id')->references('id')->on('localidades')->onDelete('restrict');

            // Recrear índices
            $table->index(['locality_id', 'status']);
        });

        echo "ADVERTENCIA: Columna locality_id recreada pero SIN DATOS." . PHP_EOL;
        echo "Necesitas restaurar los datos desde un backup." . PHP_EOL;
    }
};
