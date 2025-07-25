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
        Schema::create('routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('circuit_id')->constrained('circuits')->onDelete('restrict')->comment('Referencia al circuito');
            $table->string('name', 25)->unique()->comment('Nombre de la ruta');
            $table->string('code', 25)->unique()->comment('Código identificador de la ruta');
            $table->boolean('status')->default(true)->comment('Estado activo/inactivo');
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index('circuit_id');
            $table->index('status');
            $table->index(['circuit_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
