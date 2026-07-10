<?php

namespace Database\Seeders;

use App\Enums\ListingType;
use App\Enums\ReservationStatus;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $client = User::query()->where('email', 'client@immo.local')->first();
        $owner = User::query()->where('email', 'proprietaire@immo.local')->first();

        if ($client === null || $owner === null) {
            return;
        }

        $property = Property::query()
            ->where('owner_id', $owner->id)
            ->where('listing_type', ListingType::Rent)
            ->where('status', 'published')
            ->orderBy('id')
            ->first();

        if ($property === null) {
            return;
        }

        $reservation = Reservation::query()
            ->where('property_id', $property->id)
            ->where('user_id', $client->id)
            ->where('status', ReservationStatus::Confirmed)
            ->whereDate('end_date', '<=', now())
            ->first();

        if ($reservation === null) {
            $start = now()->subDays(14);
            $end = now()->subDays(7);

            $reservation = Reservation::query()->create([
                'property_id' => $property->id,
                'user_id' => $client->id,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'status' => ReservationStatus::Confirmed,
                'guests' => 2,
                'total_price' => 350,
                'currency' => $property->currency,
                'message' => 'Séjour terminé (démo avis).',
            ]);
        }

        Review::query()->updateOrCreate(
            [
                'property_id' => $property->id,
                'user_id' => $client->id,
            ],
            [
                'reservation_id' => $reservation->id,
                'rating' => 5,
                'comment' => 'Excellent séjour, logement conforme à l\'annonce. Propriétaire réactif.',
            ],
        );
    }
}
