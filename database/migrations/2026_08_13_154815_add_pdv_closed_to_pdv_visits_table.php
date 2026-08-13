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
            $table->boolean('pdv_closed')->default(false)
                ->comment('¿La visita se finalizó porque el PDV estaba cerrado (sin esperar el tiempo mínimo)?');
            $table->text('closed_reason')->nullable()
                ->comment('Observación del vendedor explicando por qué el PDV estaba cerrado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdv_visits', function (Blueprint $table) {
            $table->dropColumn(['pdv_closed', 'closed_reason']);
        });
    }
};
