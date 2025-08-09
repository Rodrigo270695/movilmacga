<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pdvs', function (Blueprint $table) {
            // Paso 1: Agregar nuevas columnas
            $table->foreignId('district_id')->nullable()->after('longitude')->comment('District reference');
            $table->string('locality', 255)->nullable()->after('district_id')->comment('Free text locality field');

            // Paso 2: Agregar foreign key constraint
            $table->foreign('district_id')->references('id')->on('distritos')->onDelete('restrict');

            // Paso 3: Agregar índice para performance
            $table->index(['district_id', 'status']);
        });

        // Paso 4: Migrar datos existentes
        // Obtener distrito_id basado en locality_id y migrar el nombre de la localidad
        DB::statement('
            UPDATE pdvs
            SET district_id = (
                SELECT l.distrito_id
                FROM localidades l
                WHERE l.id = pdvs.locality_id
            ),
            locality = (
                SELECT l.name
                FROM localidades l
                WHERE l.id = pdvs.locality_id
            )
            WHERE locality_id IS NOT NULL
        ');

        // Verificar que todos los registros se migraron correctamente
        echo "Migración completada." . PHP_EOL;
        echo "PDVs con district_id: " . DB::table('pdvs')->whereNotNull('district_id')->count() . PHP_EOL;
        echo "PDVs con locality: " . DB::table('pdvs')->whereNotNull('locality')->count() . PHP_EOL;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdvs', function (Blueprint $table) {
            // Eliminar foreign key constraint
            $table->dropForeign(['district_id']);

            // Eliminar índice
            $table->dropIndex(['district_id', 'status']);

            // Eliminar columnas nuevas
            $table->dropColumn(['district_id', 'locality']);
        });
    }
};
