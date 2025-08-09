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
        Schema::table('pdvs', function (Blueprint $table) {
            // Eliminar constraint único del documento
            $table->dropUnique('unique_document');
        });

        echo "Constraint único del documento eliminado exitosamente." . PHP_EOL;
        echo "Ahora los PDVs pueden tener el mismo número de documento." . PHP_EOL;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdvs', function (Blueprint $table) {
            // Recrear constraint único del documento
            $table->unique(['document_type', 'document_number'], 'unique_document');
        });

        echo "Constraint único del documento restaurado." . PHP_EOL;
    }
};
