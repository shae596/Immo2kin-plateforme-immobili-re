<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recommendation_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('property_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('event_type', 32);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'event_type', 'created_at']);
            $table->index(['property_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recommendation_events');
    }
};
