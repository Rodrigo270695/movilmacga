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
        Schema::create('business_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->onDelete('cascade');
            $table->string('name'); // Nombre del formulario
            $table->text('description')->nullable(); // Descripción del formulario
            $table->boolean('is_active')->default(true); // Estado activo/inactivo
            $table->json('settings')->nullable(); // Configuraciones adicionales (JSON)
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['business_id', 'is_active']); 
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_forms');
    }
};
