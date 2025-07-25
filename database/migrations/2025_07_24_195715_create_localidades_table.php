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
        Schema::create('localidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distrito_id')->constrained('distritos')->onDelete('restrict')->comment('Referencia al distrito');
            $table->string('name', 100)->comment('Nombre de la localidad');
            $table->boolean('status')->default(true)->comment('Estado activo/inactivo');
            $table->timestamps();

            $table->index('distrito_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('localidades');
    }
};
