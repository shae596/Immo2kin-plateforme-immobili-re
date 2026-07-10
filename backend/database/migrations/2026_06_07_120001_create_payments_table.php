<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3);
            $table->string('method', 32);
            $table->string('status', 32);
            $table->string('provider', 32)->nullable();
            $table->string('provider_payment_id')->nullable();
            $table->string('mobile_phone', 20)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['reservation_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->unique(['provider', 'provider_payment_id']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->timestamp('paid_at')->nullable()->after('message');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('paid_at');
        });

        Schema::dropIfExists('payments');
    }
};
