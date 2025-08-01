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
        Schema::create('gps_tracking', function (Blueprint $table) {
            $table->id();

            // Usuario que está siendo rastreado
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')
                ->comment('Usuario (vendedor o supervisor) siendo rastreado por GPS');

            // Coordenadas GPS
            $table->decimal('latitude', 10, 8)->comment('Latitud GPS (coordenada Y)');
            $table->decimal('longitude', 11, 8)->comment('Longitud GPS (coordenada X)');

            // Información adicional del GPS
            $table->float('accuracy')->nullable()->comment('Precisión del GPS en metros');
            $table->float('speed')->nullable()->comment('Velocidad en km/h');
            $table->float('heading')->nullable()->comment('Dirección en grados (0-360)');
            $table->integer('battery_level')->nullable()->comment('Nivel de batería del dispositivo (0-100)');

            // Detección de fraude
            $table->boolean('is_mock_location')->default(false)
                ->comment('¿Se detectó GPS falso/simulado?');

            // Timestamps
            $table->timestamp('recorded_at')->comment('Momento exacto de registro GPS');
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['user_id', 'recorded_at']);
            $table->index('recorded_at');
            $table->index(['latitude', 'longitude']);
            $table->index(['user_id', 'recorded_at', 'is_mock_location']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gps_tracking');
    }
};
