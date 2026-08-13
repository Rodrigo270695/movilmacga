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
            // Máximo de visitas que un vendedor puede registrar al mismo PDV
            // en el mismo día. Configurable por marca; por defecto 2.
            $table->unsignedInteger('max_visits_per_pdv_per_day')
                ->default(2)
                ->after('min_visit_duration_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('max_visits_per_pdv_per_day');
        });
    }
};
