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

/**
 * Ajoute 10 annonces de démo (communes variées, sans photos) sans supprimer l'existant.
 * Usage : php artisan db:seed --class=ExtraPropertySeeder
 */
class ExtraPropertySeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->where('email', 'proprietaire@immo.local')->first();

        if ($owner === null) {
            $this->command?->warn('Compte proprietaire@immo.local introuvable. Lancez DatabaseSeeder d\'abord.');

            return;
        }

        $amenitiesByName = Amenity::query()->pluck('id', 'name');

        $properties = [
            [
                'title' => 'Terrain constructible — Matete',
                'description' => 'Parcelle de 500 m² en zone résidentielle, accès route goudronnée, titre en règle. Idéal petit immeuble ou maison individuelle.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Sale,
                'price' => 45000,
                'city' => 'Kinshasa',
                'commune' => 'Matete',
                'rooms' => null,
                'bathrooms' => null,
                'has_kitchen' => false,
                'has_living_room' => false,
                'has_store' => false,
                'area' => 500,
                'type' => PropertyType::Terrain,
                'amenities' => ['Eau courante', 'Électricité'],
            ],
            [
                'title' => 'Maison familiale à louer — Masina',
                'description' => 'Maison 4 chambres avec cour intérieure, quartier calme proche marché central de Masina. Loyer mensuel, disponible immédiatement.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 700,
                'city' => 'Kinshasa',
                'commune' => 'Masina',
                'rooms' => 4,
                'bathrooms' => 2,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => true,
                'area' => 180,
                'type' => PropertyType::Maison,
                'amenities' => ['Parking', 'Gardien', 'Cuisine équipée', 'Eau courante'],
            ],
            [
                'title' => 'Maison à vendre — Mont Ngafula',
                'description' => 'Maison récente sur parcelle clôturée, vue dégagée, à deux pas des écoles. Vente directe, documents disponibles.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Sale,
                'price' => 95000,
                'city' => 'Kinshasa',
                'commune' => 'Mont Ngafula',
                'rooms' => 4,
                'bathrooms' => 3,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => false,
                'area' => 220,
                'type' => PropertyType::Maison,
                'amenities' => ['Parking', 'Gardien', 'Balcon'],
            ],
            [
                'title' => 'Appartement 3 chambres — Kimbanseke',
                'description' => 'Appartement au 2e étage, salon spacieux, immeuble sécurisé. Location longue durée, charges modérées.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 480,
                'city' => 'Kinshasa',
                'commune' => 'Kimbanseke',
                'rooms' => 3,
                'bathrooms' => 2,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => false,
                'area' => 95,
                'type' => PropertyType::Appartement,
                'amenities' => ['Wi-Fi', 'Climatisation', 'Gardien'],
            ],
            [
                'title' => 'Studio meublé — Barumbu',
                'description' => 'Studio tout équipé pour jeune actif, proche axes vers le centre-ville. Internet inclus, bail flexible.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 280,
                'city' => 'Kinshasa',
                'commune' => 'Barumbu',
                'rooms' => 1,
                'bathrooms' => 1,
                'has_kitchen' => true,
                'has_living_room' => false,
                'has_store' => false,
                'area' => 32,
                'type' => PropertyType::Studio,
                'amenities' => ['Wi-Fi', 'Meublé', 'Cuisine équipée', 'Climatisation'],
            ],
            [
                'title' => 'Villa avec jardin — Selembao',
                'description' => 'Villa standing 5 chambres, grand jardin et garage double. Quartier résidentiel recherché, piscine communautaire à proximité.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Sale,
                'price' => 210000,
                'city' => 'Kinshasa',
                'commune' => 'Selembao',
                'rooms' => 5,
                'bathrooms' => 4,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => true,
                'area' => 380,
                'type' => PropertyType::Villa,
                'amenities' => ['Parking', 'Piscine', 'Gardien', 'Climatisation', 'Balcon'],
            ],
            [
                'title' => 'Bureau open space — Makala',
                'description' => 'Plateau de bureaux modulable 120 m², climatisation centralisée, fibre optique. Idéal startup ou cabinet.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 1800,
                'city' => 'Kinshasa',
                'commune' => 'Makala',
                'rooms' => 2,
                'bathrooms' => 2,
                'has_kitchen' => false,
                'has_living_room' => false,
                'has_store' => false,
                'area' => 120,
                'type' => PropertyType::Bureau,
                'amenities' => ['Wi-Fi', 'Climatisation', 'Parking', 'Gardien'],
            ],
            [
                'title' => 'Local commercial — Ndjili',
                'description' => 'Boutique angle de rue, forte affluence piétonne près de l\'aéroport. Idéal alimentation, téléphonie ou show-room.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Rent,
                'price' => 950,
                'city' => 'Kinshasa',
                'commune' => 'Ndjili',
                'rooms' => 1,
                'bathrooms' => 1,
                'has_kitchen' => false,
                'has_living_room' => false,
                'has_store' => true,
                'area' => 65,
                'type' => PropertyType::Commerce,
                'amenities' => ['Électricité', 'Eau courante', 'Gardien'],
            ],
            [
                'title' => 'Parcelle viabilisée — Kisenso',
                'description' => 'Terrain 350 m² viabilisé (eau, électricité), zone en développement. Prix négociable, visite sur rendez-vous.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Sale,
                'price' => 28000,
                'city' => 'Kinshasa',
                'commune' => 'Kisenso',
                'rooms' => null,
                'bathrooms' => null,
                'has_kitchen' => false,
                'has_living_room' => false,
                'has_store' => false,
                'area' => 350,
                'type' => PropertyType::Terrain,
                'amenities' => ['Eau courante', 'Électricité'],
            ],
            [
                'title' => 'Appartement neuf à vendre — Bumbu',
                'description' => 'Appartement 2 chambres dans résidence récente, finitions haut de gamme. Ascenseur, parking sous-sol.',
                'status' => PropertyStatus::Published,
                'listing_type' => ListingType::Sale,
                'price' => 62000,
                'city' => 'Kinshasa',
                'commune' => 'Bumbu',
                'rooms' => 2,
                'bathrooms' => 2,
                'has_kitchen' => true,
                'has_living_room' => true,
                'has_store' => false,
                'area' => 88,
                'type' => PropertyType::Appartement,
                'amenities' => ['Parking', 'Climatisation', 'Balcon', 'Gardien'],
            ],
        ];

        $created = 0;
        $skipped = 0;

        foreach ($properties as $data) {
            $amenityNames = $data['amenities'];
            unset($data['amenities']);

            if (Property::query()->where('owner_id', $owner->id)->where('title', $data['title'])->exists()) {
                $skipped++;

                continue;
            }

            $geo = KinshasaCommuneCoordinates::forCommune($data['commune']) ?? [];

            $property = Property::query()->create(
                array_merge($data, $geo, [
                    'owner_id' => $owner->id,
                    'currency' => 'USD',
                ]),
            );

            $amenityIds = collect($amenityNames)
                ->map(fn (string $name) => $amenitiesByName[$name] ?? null)
                ->filter()
                ->values()
                ->all();

            if ($amenityIds !== []) {
                $property->amenities()->sync($amenityIds);
            }

            $created++;
        }

        $this->command?->info("ExtraPropertySeeder : {$created} annonce(s) créée(s), {$skipped} déjà présente(s).");
    }
}
