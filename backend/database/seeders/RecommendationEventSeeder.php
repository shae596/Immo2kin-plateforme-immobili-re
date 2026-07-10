<?php

namespace Database\Seeders;

use App\Enums\ListingType;
use App\Enums\RecommendationEventType;
use App\Models\Property;
use App\Models\RecommendationEvent;
use App\Models\User;
use Illuminate\Database\Seeder;

class RecommendationEventSeeder extends Seeder
{
    public function run(): void
    {
        $client = User::query()->where('email', 'client@immo.local')->first();
        $owner = User::query()->where('email', 'proprietaire@immo.local')->first();

        if ($client === null || $owner === null) {
            return;
        }

        RecommendationEvent::query()->where('user_id', $client->id)->delete();

        $properties = Property::query()
            ->where('owner_id', $owner->id)
            ->where('listing_type', ListingType::Rent)
            ->where('status', 'published')
            ->orderBy('id')
            ->take(4)
            ->get();

        foreach ($properties as $index => $property) {
            RecommendationEvent::query()->create([
                'user_id' => $client->id,
                'property_id' => $property->id,
                'event_type' => $index === 0
                    ? RecommendationEventType::Favorite
                    : RecommendationEventType::View,
            ]);
        }
    }
}
