<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->boolean('has_kitchen')->default(false)->after('bathrooms');
            $table->boolean('has_living_room')->default(false)->after('has_kitchen');
            $table->boolean('has_store')->default(false)->after('has_living_room');
            $table->string('listing_type')->default('rent')->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->dropColumn([
                'has_kitchen',
                'has_living_room',
                'has_store',
                'listing_type',
            ]);
        });
    }
};
