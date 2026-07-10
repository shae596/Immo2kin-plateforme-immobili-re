<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 20)->default('pending');
            $table->unsignedSmallInteger('guests')->nullable();
            $table->decimal('total_price', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->text('message')->nullable();
            $table->timestamps();

            $table->index(['property_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['property_id', 'start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
