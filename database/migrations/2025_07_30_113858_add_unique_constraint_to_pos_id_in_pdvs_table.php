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
            // Agregar índice único al campo pos_id
            $table->unique('pos_id', 'pdvs_pos_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdvs', function (Blueprint $table) {
            // Remover el índice único
            $table->dropUnique('pdvs_pos_id_unique');
        });
    }
};
