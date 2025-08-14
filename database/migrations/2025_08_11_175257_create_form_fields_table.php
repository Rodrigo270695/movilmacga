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
        Schema::create('form_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_section_id')->constrained('form_sections')->onDelete('cascade');
            $table->string('field_type'); // Tipo de campo (text, number, select, checkbox, image, pdf, location, signature, etc.)
            $table->string('label'); // Etiqueta del campo
            $table->string('placeholder')->nullable(); // Texto de ayuda
            $table->boolean('is_required')->default(false); // Campo obligatorio
            $table->json('validation_rules')->nullable(); // Reglas de validación (JSON)
            $table->json('options')->nullable(); // Opciones para selects/checkboxes (JSON)
            $table->integer('order_index')->default(0); // Orden en la sección 
            $table->decimal('min_value', 10, 2)->nullable(); // Valor mínimo para campos numéricos
            $table->decimal('max_value', 10, 2)->nullable(); // Valor máximo para campos numéricos
            $table->string('file_types')->nullable(); // Tipos de archivo permitidos (jpg,png,pdf)
            $table->integer('max_file_size')->nullable(); // Tamaño máximo de archivo en KB
            $table->boolean('is_active')->default(true); // Estado activo/inactivo
            $table->json('settings')->nullable(); // Configuraciones adicionales específicas del campo (JSON)
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['form_section_id', 'order_index']);
            $table->index(['form_section_id', 'is_active']);
            $table->index('field_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_fields');
    }
};
