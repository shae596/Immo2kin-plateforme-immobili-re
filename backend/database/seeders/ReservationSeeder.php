<?php

namespace Database\Seeders;

use App\Enums\ListingType;
use App\Enums\ReservationStatus;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ReservationSeeder extends Seeder
{
    public function run(): void
    {
        $client = User::query()->where('email', 'client@immo.local')->first();
        $owner = User::query()->where('email', 'proprietaire@immo.local')->first();

        if ($client === null || $owner === null) {
            return;
        }

        Reservation::query()
            ->whereIn('user_id', [$client->id])
            ->orWhereHas('property', fn ($q) => $q->where('owner_id', $owner->id))
            ->delete();

        $rentals = Property::query()
            ->where('owner_id', $owner->id)
            ->where('listing_type', ListingType::Rent)
            ->where('status', 'published')
            ->orderBy('id')
            ->take(3)
            ->get();

        if ($rentals->isEmpty()) {
            return;
        }

        $samples = [
            [
                'property' => $rentals[0],
                'start_date' => now()->addDays(14)->toDateString(),
                'end_date' => now()->addDays(17)->toDateString(),
                'status' => ReservationStatus::Pending,
                'guests' => 2,
                'message' => 'Arrivée prévue vers 15h, merci.',
            ],
            [
                'property' => $rentals[1] ?? $rentals[0],
                'start_date' => now()->addDays(30)->toDateString(),
                'end_date' => now()->addDays(37)->toDateString(),
                'status' => ReservationStatus::Confirmed,
                'guests' => 3,
                'message' => null,
            ],
        ];

        foreach ($samples as $sample) {
            $property = $sample['property'];
            $nights = max(1, Carbon::parse($sample['start_date'])->diffInDays(Carbon::parse($sample['end_date'])) + 1);
            $nightly = (float) $property->price / 30;
            $total = round($nightly * $nights, 2);

            Reservation::query()->create([
                'property_id' => $property->id,
                'user_id' => $client->id,
                'start_date' => $sample['start_date'],
                'end_date' => $sample['end_date'],
                'status' => $sample['status'],
                'guests' => $sample['guests'],
                'total_price' => $total,
                'currency' => $property->currency,
                'message' => $sample['message'],
            ]);
        }
    }
}
