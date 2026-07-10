<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $amenities = [
            ['name' => 'Wi-Fi', 'icon' => 'wifi'],
            ['name' => 'Parking', 'icon' => 'parking'],
            ['name' => 'Climatisation', 'icon' => 'ac'],
            ['name' => 'Piscine', 'icon' => 'pool'],
            ['name' => 'Gardien', 'icon' => 'security'],
            ['name' => 'Cuisine équipée', 'icon' => 'kitchen'],
            ['name' => 'Meublé', 'icon' => 'furniture'],
            ['name' => 'Balcon', 'icon' => 'balcony'],
            ['name' => 'Eau courante', 'icon' => 'water'],
            ['name' => 'Électricité', 'icon' => 'electricity'],
        ];

        foreach ($amenities as $amenity) {
            Amenity::query()->updateOrCreate(
                ['name' => $amenity['name']],
                ['icon' => $amenity['icon']],
            );
        }
    }
}
