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
        Schema::create('pdv_visit_form_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pdv_visit_id')->constrained('pdv_visits')->onDelete('cascade');
            $table->foreignId('form_field_id')->constrained('form_fields')->onDelete('cascade');
            $table->text('response_value')->nullable(); // Valor de la respuesta (texto/número)
            $table->string('response_file')->nullable(); // Archivo subido (imagen/PDF) - path del archivo
            $table->json('response_location')->nullable(); // Coordenadas GPS (JSON: {lat, lng, accuracy})
            $table->text('response_signature')->nullable(); // Firma digital (base64 o path)
            $table->json('response_metadata')->nullable(); // Metadatos adicionales (JSON)
            $table->timestamps(); 

            // Índices para optimizar consultas
            $table->index(['pdv_visit_id', 'form_field_id']);
            $table->index('pdv_visit_id');
            $table->index('form_field_id');

            // Una respuesta por campo por visita
            $table->unique(['pdv_visit_id', 'form_field_id'], 'unique_visit_field_response');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdv_visit_form_responses');
    }
};
