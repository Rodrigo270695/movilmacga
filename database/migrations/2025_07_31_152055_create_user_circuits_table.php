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
        Schema::create('user_circuits', function (Blueprint $table) {
            $table->id();

            // Referencias principales
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')
                ->comment('Usuario asignado (vendedor)');
            $table->foreignId('circuit_id')->constrained('circuits')->onDelete('cascade')
                ->comment('Circuito asignado al vendedor');

            // Información de asignación
            $table->date('assigned_date')->default(now())->comment('Fecha de asignación');
            $table->boolean('is_active')->default(true)->comment('¿Asignación activa?');
            $table->integer('priority')->default(1)->comment('Prioridad del circuito (1=alta, 5=baja)');

            // Información adicional
            $table->text('notes')->nullable()->comment('Instrucciones o notas especiales para el circuito');
            $table->json('assignment_data')->nullable()->comment('Datos adicionales de la asignación');

            // Fechas de vigencia
            $table->date('valid_from')->default(now())->comment('Válido desde');
            $table->date('valid_until')->nullable()->comment('Válido hasta (null = indefinido)');

            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['user_id', 'is_active']);
            $table->index(['circuit_id', 'is_active']);
            $table->index(['assigned_date', 'is_active']);
            $table->index(['user_id', 'circuit_id', 'is_active']);

            // Constraint: Un vendedor no puede tener el mismo circuito asignado dos veces activo
            $table->unique(['user_id', 'circuit_id', 'is_active'], 'unique_user_circuit_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_circuits');
    }
};
