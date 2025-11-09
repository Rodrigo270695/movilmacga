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
        Schema::table('pdv_visits', function (Blueprint $table) {
            if (!Schema::hasColumn('pdv_visits', 'used_mock_location')) {
                $table->boolean('used_mock_location')
                    ->default(false)
                    ->after('is_valid')
                    ->comment('Indica si se detectó uso de ubicación simulada (mock location)');
                $table->index(['used_mock_location', 'check_in_at'], 'pdv_visits_mock_location_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdv_visits', function (Blueprint $table) {
            if (Schema::hasColumn('pdv_visits', 'used_mock_location')) {
                $table->dropIndex('pdv_visits_mock_location_index');
                $table->dropColumn('used_mock_location');
            }
        });
    }
};

