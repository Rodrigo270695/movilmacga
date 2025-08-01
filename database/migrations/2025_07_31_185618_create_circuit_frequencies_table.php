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
        Schema::create('circuit_frequencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('circuit_id')->constrained('circuits')->onDelete('cascade')
                ->comment('Circuito al que pertenece esta frecuencia');
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
                ->comment('Día de la semana para la visita');
            $table->timestamps();

            // Índice para optimizar consultas por circuito
            $table->index('circuit_id');

            // Evitar duplicados: un circuito no puede tener el mismo día dos veces
            $table->unique(['circuit_id', 'day_of_week'], 'unique_circuit_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('circuit_frequencies');
    }
};
