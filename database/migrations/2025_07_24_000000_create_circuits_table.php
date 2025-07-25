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
        Schema::create('circuits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zonal_id')->constrained('zonales')->onDelete('restrict')->comment('Referencia al zonal');
            $table->string('name', 25)->unique()->comment('Nombre del circuito');
            $table->string('code', 25)->unique()->comment('Código identificador del circuito');
            $table->boolean('status')->default(true)->comment('Estado activo/inactivo');
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index('zonal_id');
            $table->index('status');
            $table->index(['zonal_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('circuits');
    }
};
