<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'user_id' => User::factory(),
            'reservation_id' => null,
            'rating' => fake()->numberBetween(3, 5),
            'comment' => fake()->optional()->paragraph(),
        ];
    }

    public function forReservation(Reservation $reservation): static
    {
        return $this->state(fn () => [
            'property_id' => $reservation->property_id,
            'user_id' => $reservation->user_id,
            'reservation_id' => $reservation->id,
        ]);
    }
}
