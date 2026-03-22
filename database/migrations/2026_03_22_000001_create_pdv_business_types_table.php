<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tipos de negocio alineados con la validación de PDV (App\Http\Requests\DCS\PdvRequest).
     */
    private function businessTypeEnum(): array
    {
        return [
            'Telco',
            'Bodega',
            'Agente',
            'Market',
            'Servicio Técnico',
            'Otros',
            'Exclusivo',
        ];
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pdv_business_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pdv_id')->constrained('pdvs')->onDelete('cascade')
                ->comment('PDV al que aplica esta configuración de tipo de negocio');
            $table->enum('business_type', $this->businessTypeEnum())
                ->comment('Tipo de negocio (mismos valores que pdvs.classification en la app)');
            $table->timestamps();

            $table->unique(['pdv_id', 'business_type'], 'pdv_business_types_pdv_business_unique');
            $table->index('business_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdv_business_types');
    }
};
