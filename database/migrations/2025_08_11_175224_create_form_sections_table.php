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
        Schema::create('form_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_form_id')->constrained('business_forms')->onDelete('cascade');
            $table->string('name'); // Nombre de la sección
            $table->text('description')->nullable(); // Descripción de la sección
            $table->integer('order_index')->default(0); // Orden de aparición
            $table->boolean('is_required')->default(false); // Si la sección es obligatoria
            $table->boolean('is_active')->default(true); // Estado activo/inactivo
            $table->json('settings')->nullable(); // Configuraciones adicionales (JSON) 
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['business_form_id', 'order_index']);
            $table->index(['business_form_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_sections');
    }
};
