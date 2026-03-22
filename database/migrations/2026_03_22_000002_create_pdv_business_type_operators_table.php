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
        Schema::create('pdv_business_type_operators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pdv_business_type_id')->constrained('pdv_business_types')->onDelete('cascade')
                ->comment('Configuración PDV + tipo de negocio');
            $table->foreignId('operator_id')->constrained('operators')->onDelete('cascade');
            $table->enum('sale_mode', ['prepago', 'pospago'])
                ->comment('Modalidad de venta');
            $table->boolean('status')->default(true)->comment('Asociación activa (check marcado)');
            $table->timestamps();

            $table->unique(
                ['pdv_business_type_id', 'operator_id', 'sale_mode'],
                'pdv_business_type_operators_unique'
            );
            $table->index(['pdv_business_type_id', 'sale_mode']);
            $table->index(['operator_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdv_business_type_operators');
    }
};
