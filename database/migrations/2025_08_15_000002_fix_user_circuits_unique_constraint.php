<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Problema: El constraint actual permite duplicados cuando is_active=false
     * Solución: Usar soft deletes en lugar de is_active para asignaciones
     * O cambiar a un constraint parcial solo para is_active=true
     */
    public function up(): void
    {
        Schema::table('user_circuits', function (Blueprint $table) {
            // Eliminar el constraint problemático
            $table->dropUnique('unique_user_circuit_active');

            // OPCIÓN 1: Constraint simple sin considerar is_active
            // Esto previene que un usuario tenga el mismo circuito múltiples veces
            // independiente del estado
            $table->unique(['user_id', 'circuit_id'], 'unique_user_circuit');

            // NOTA: Si necesitas múltiples asignaciones históricas del mismo
            // circuito, considera usar soft deletes en lugar de is_active
        });

        echo "✅ Constraint único actualizado en user_circuits" . PHP_EOL;
        echo "📝 Ahora un usuario solo puede tener UNA asignación por circuito" . PHP_EOL;
        echo "💡 Usa 'is_active' para activar/desactivar, no para eliminar" . PHP_EOL;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_circuits', function (Blueprint $table) {
            // Revertir al constraint original (problemático)
            $table->dropUnique('unique_user_circuit');
            $table->unique(['user_id', 'circuit_id', 'is_active'], 'unique_user_circuit_active');
        });

        echo "⚠️ Revertido a constraint original (permite duplicados inactivos)" . PHP_EOL;
    }
};

