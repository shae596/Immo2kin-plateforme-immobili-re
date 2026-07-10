<?php

namespace Database\Factories;

use App\Enums\VerificationStatus;
use App\Enums\VerificationType;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Verification>
 */
class VerificationFactory extends Factory
{
    protected $model = Verification::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'property_id' => null,
            'type' => VerificationType::Identity,
            'status' => VerificationStatus::Pending,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function identity(): static
    {
        return $this->state(fn () => [
            'type' => VerificationType::Identity,
            'property_id' => null,
        ]);
    }

    public function property(int $propertyId): static
    {
        return $this->state(fn () => [
            'type' => VerificationType::Property,
            'property_id' => $propertyId,
        ]);
    }
}
