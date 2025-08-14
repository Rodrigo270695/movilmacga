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
        Schema::create('pdv_form_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pdv_id')->constrained('pdvs')->onDelete('cascade');
            $table->foreignId('business_form_id')->constrained('business_forms')->onDelete('cascade');
            $table->boolean('is_active')->default(true); // Estado de la asignación
            $table->json('settings')->nullable(); // Configuraciones específicas para este PDV (JSON)
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['pdv_id', 'is_active']);
            $table->index(['business_form_id', 'is_active']);

            // Un PDV solo puede tener un formulario activo por tipo
            $table->unique(['pdv_id', 'business_form_id'], 'unique_pdv_form_assignment'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdv_form_assignments');
    }
};
