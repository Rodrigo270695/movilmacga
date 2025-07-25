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
        Schema::create('pdvs', function (Blueprint $table) {
            $table->id();

            // Point information
            $table->string('point_name', 50)->unique()->comment('Unique point name');
            $table->string('pos_id')->nullable()->comment('POS ID identifier');

            // Document information
            $table->enum('document_type', ['DNI', 'RUC'])->comment('Document type');
            $table->string('document_number', 12)->comment('Document number (DNI: 8 digits, RUC: 12 digits)');

            // Client information
            $table->string('client_name')->comment('Client full name');
            $table->string('email')->nullable()->comment('Client email');
            $table->string('phone')->nullable()->comment('Client phone number');

                                    // Business information
            $table->boolean('sells_recharge')->comment('Whether the PDV sells recharge');

            // Classification information
            $table->enum('classification', [
                'telecomunicaciones',
                'chalequeros',
                'bodega',
                'otras tiendas',
                'desconocida',
                'pusher'
            ])->comment('PDV business classification');

                        // Status information
            $table->enum('status', [
                'vende',
                'no vende',
                'no existe',
                'pdv autoactivado',
                'pdv impulsador'
            ])->comment('PDV current status');

            // Location information
            $table->text('address')->comment('PDV physical address');
            $table->text('reference')->nullable()->comment('Address reference');
            $table->decimal('latitude', 10, 8)->nullable()->comment('Latitude coordinate for map location (X)');
            $table->decimal('longitude', 11, 8)->nullable()->comment('Longitude coordinate for map location (Y)');

            // Foreign keys
            $table->foreignId('route_id')->constrained('routes')->onDelete('cascade')->comment('Route reference');
            $table->foreignId('locality_id')->constrained('localidades')->onDelete('restrict')->comment('Locality reference');

            $table->timestamps();

            // Indexes for performance
            $table->index('status');
            $table->index('document_type');
            $table->index('sells_recharge');
            $table->index('classification');
            $table->index(['route_id', 'status']);
            $table->index(['locality_id', 'status']);
            $table->index(['latitude', 'longitude']);

            // Unique constraint for document
            $table->unique(['document_type', 'document_number'], 'unique_document');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdvs');
    }
};
