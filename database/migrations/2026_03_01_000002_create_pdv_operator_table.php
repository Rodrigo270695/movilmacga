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
        Schema::create('pdv_operator', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pdv_id')->constrained('pdvs')->onDelete('cascade');
            $table->foreignId('operator_id')->constrained('operators')->onDelete('cascade');
            $table->boolean('status')->default(true)->comment('Association status (yes/no)');
            $table->timestamps();

            $table->unique(['pdv_id', 'operator_id'], 'pdv_operator_unique');
            $table->index(['pdv_id', 'status']);
            $table->index(['operator_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdv_operator');
    }
};
