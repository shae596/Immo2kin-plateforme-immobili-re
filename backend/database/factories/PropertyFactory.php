<?php

namespace Database\Factories;

use App\Enums\ListingType;
use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Property> */
class PropertyFactory extends Factory
{
    protected $model = Property::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraphs(2, true),
            'status' => PropertyStatus::Published,
            'price' => fake()->numberBetween(200, 5000),
            'currency' => 'USD',
            'city' => 'Kinshasa',
            'commune' => fake()->randomElement(['Gombe', 'Lingwala', 'Bandalungwa', 'Kalamu']),
            'address' => fake()->streetAddress(),
            'latitude' => fake()->latitude(-4.5, -4.2),
            'longitude' => fake()->longitude(15.2, 15.4),
            'rooms' => fake()->numberBetween(1, 5),
            'bathrooms' => fake()->numberBetween(1, 3),
            'has_kitchen' => true,
            'has_living_room' => true,
            'has_store' => fake()->boolean(30),
            'area' => fake()->numberBetween(40, 250),
            'type' => fake()->randomElement(PropertyType::values()),
            'listing_type' => ListingType::Rent,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => PropertyStatus::Draft]);
    }

    public function published(): static
    {
        return $this->state(fn () => ['status' => PropertyStatus::Published]);
    }
}
