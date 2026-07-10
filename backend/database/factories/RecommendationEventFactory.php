<?php

namespace Database\Factories;

use App\Enums\RecommendationEventType;
use App\Models\Property;
use App\Models\RecommendationEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecommendationEvent>
 */
class RecommendationEventFactory extends Factory
{
    protected $model = RecommendationEvent::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'property_id' => Property::factory(),
            'event_type' => RecommendationEventType::View,
            'metadata' => null,
        ];
    }
}
