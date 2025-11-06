<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Eliminar la constraint única que impide múltiples supervisores por zonal
        // Ahora se permiten hasta 5 supervisores activos por zonal
        try {
            DB::statement('ALTER TABLE `zonal_supervisors` DROP INDEX `unique_active_zonal_supervisor`');
        } catch (\Exception $e) {
            // La constraint ya fue eliminada o no existe - continuar
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restaurar la constraint única (solo para rollback)
        DB::statement('ALTER TABLE `zonal_supervisors` ADD UNIQUE `unique_active_zonal_supervisor` (`zonal_id`, `is_active`)');
    }
};

