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
        Schema::create('zonales', function (Blueprint $table) {
            $table->id();
            $table->string('name', 30)->unique()->comment('Nombre del zonal');
            $table->boolean('status')->default(true)->comment('Estado activo/inactivo');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zonales');
    }
};
