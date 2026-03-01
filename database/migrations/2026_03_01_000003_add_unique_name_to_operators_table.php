<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Añade unique(name) solo si no existe (p. ej. tabla creada sin unique en versiones anteriores).
     */
    public function up(): void
    {
        $indexExists = collect(DB::select("SHOW INDEX FROM operators WHERE Key_name = 'operators_name_unique'"))->isNotEmpty();

        if (!$indexExists) {
            Schema::table('operators', function (Blueprint $table) {
                $table->unique('name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $indexExists = collect(DB::select("SHOW INDEX FROM operators WHERE Key_name = 'operators_name_unique'"))->isNotEmpty();

        if ($indexExists) {
            Schema::table('operators', function (Blueprint $table) {
                $table->dropUnique(['name']);
            });
        }
    }
};
