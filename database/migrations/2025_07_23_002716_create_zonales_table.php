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
            $table->foreignId('business_id')->nullable()->constrained('businesses')->onDelete('set null')->comment('Business reference');
            $table->string('name', 30)->unique()->comment('Nombre del zonal');
            $table->boolean('status')->default(true)->comment('Estado activo/inactivo');
            $table->timestamps();

            // Indexes for query optimization
            $table->index('business_id');
            $table->index('status');
            $table->index(['business_id', 'status']);
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
