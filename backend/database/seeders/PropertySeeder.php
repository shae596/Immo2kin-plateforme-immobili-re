<?php

namespace Database\Seeders;

use App\Enums\ListingType;
use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Models\Amenity;
use App\Models\Property;
use App\Models\User;
use App\Support\KinshasaCommuneCoordinates;
use Illuminate\Database\Seeder;

class PropertySeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->where('email', 'proprietaire@immo.local')->first();

        if ($owner === null) {
            return;
        }

        Property::query()->where('owner_id', $owner->id)->delete();

        $amenityIds = Amenity::query()->pluck('id')->take(5)->all();

        $properties = [
            [
                'title' => 'Appartement moderne — Gombe',
                'description' => 'Bel appartement 3 chambres avec vue sur le fleuve, proche des ambassades.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 1200,
                'city' => 'Kinshasa',
                'commune' => 'Gombe',
                'rooms' => 3,
                'bathrooms' => 2,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => false,
                'area' => 120,
                'type' => PropertyType::Appartement,
            ],
            [
                'title' => 'Maison familiale — Bandalungwa',
                'description' => 'Maison spacieuse avec jardin, idéale pour une famille.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 800,
                'city' => 'Kinshasa',
                'commune' => 'Bandalungwa',
                'rooms' => 4,
                'bathrooms' => 3,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => true,
                'area' => 200,
                'type' => PropertyType::Maison,
            ],
            [
                'title' => 'Studio meublé — Lingwala',
                'description' => 'Studio tout équipé, parfait pour un jeune professionnel.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 350,
                'city' => 'Kinshasa',
                'commune' => 'Lingwala',
                'rooms' => 1,
                'bathrooms' => 1,
                'has_kitchen' => true,
                'has_living_room' => false,
                'has_store' => false,
                'area' => 35,
                'type' => PropertyType::Studio,
            ],
            [
                'title' => 'Bureau commercial — Gombe (brouillon)',
                'description' => 'Espace bureau en centre-ville, en cours de finalisation.',
                'status' => PropertyStatus::Draft,
                'listing_type' => ListingType::Rent,
                'price' => 2500,
                'city' => 'Kinshasa',
                'commune' => 'Gombe',
                'rooms' => 2,
                'bathrooms' => 1,
                'has_kitchen' => false,
                'has_living_room' => false,
                'has_store' => false,
                'area' => 80,
                'type' => PropertyType::Bureau,
            ],
            [
                'title' => 'Villa à vendre — Ngaliema',
                'description' => 'Villa standing avec piscine et jardin, titre foncier à jour. Quartier résidentiel sécurisé.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Sale,
                'price' => 285000,
                'city' => 'Kinshasa',
                'commune' => 'Ngaliema',
                'rooms' => 5,
                'bathrooms' => 4,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => true,
                'area' => 350,
                'type' => PropertyType::Villa,
            ],
            [
                'title' => 'Appartement 2 chambres — Limete',
                'description' => 'Appartement lumineux proche des axes principaux, résidence calme.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 650,
                'city' => 'Kinshasa',
                'commune' => 'Limete',
                'rooms' => 2,
                'bathrooms' => 1,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => false,
                'area' => 90,
                'type' => PropertyType::Appartement,
            ],
            [
                'title' => 'Maison avec jardin — Kalamu',
                'description' => 'Maison récente dans quartier populaire, proche écoles et marchés.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 550,
                'city' => 'Kinshasa',
                'commune' => 'Kalamu',
                'rooms' => 3,
                'bathrooms' => 2,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => false,
                'area' => 150,
                'type' => PropertyType::Maison,
            ],
            [
                'title' => 'Local commercial — Gombe',
                'description' => 'Local en rez-de-chaussée, vitrine sur rue passante, idéal boutique ou show-room.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 1400,
                'city' => 'Kinshasa',
                'commune' => 'Gombe',
                'rooms' => 1,
                'bathrooms' => 1,
                'has_kitchen' => false,
                'has_living_room' => false,
                'has_store' => true,
                'area' => 75,
                'type' => PropertyType::Commerce,
            ],
        ];

        foreach ($properties as $data) {
            $geo = KinshasaCommuneCoordinates::forCommune($data['commune']) ?? [];
            if ($data['status'] !== PropertyStatus::Published) {
                $geo = [];
            }

            $property = Property::query()->create(
                array_merge($data, $geo, [
                    'owner_id' => $owner->id,
                    'currency' => 'USD',
                ]),
            );

            if ($amenityIds !== []) {
                $property->amenities()->sync($amenityIds);
            }
        }
    }
}
