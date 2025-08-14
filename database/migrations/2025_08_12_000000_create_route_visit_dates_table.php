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
        Schema::create('route_visit_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('routes')->onDelete('cascade')
                ->comment('Ruta a la que pertenece esta fecha de visita');
            $table->date('visit_date')
                ->comment('Fecha específica de la visita');
            $table->boolean('is_active')->default(true)
                ->comment('Indica si esta fecha de visita está activa');
            $table->text('notes')->nullable() 
                ->comment('Notas adicionales sobre la visita en esta fecha');
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index('route_id');
            $table->index('visit_date');
            $table->index(['route_id', 'visit_date']);
            $table->index(['route_id', 'is_active']);

            // Evitar duplicados: una ruta no puede tener la misma fecha dos veces
            $table->unique(['route_id', 'visit_date'], 'unique_route_visit_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_visit_dates');
    }
};
