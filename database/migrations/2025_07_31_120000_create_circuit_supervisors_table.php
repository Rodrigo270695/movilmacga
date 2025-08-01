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
        Schema::create('circuit_supervisors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('circuit_id')->constrained('circuits')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Supervisor
            $table->timestamp('assigned_at')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->json('assignment_data')->nullable(); // Datos adicionales de la asignación
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['circuit_id', 'is_active']);
            $table->index(['user_id', 'is_active']);

            // Un circuito solo puede tener un supervisor activo
            // Nota: La restricción única se maneja en el nivel de aplicación
            // para permitir múltiples registros inactivos por circuito
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('circuit_supervisors');
    }
};
