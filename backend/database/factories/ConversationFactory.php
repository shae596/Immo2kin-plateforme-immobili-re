<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Conversation>
 */
class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition(): array
    {
        $property = Property::factory()->published()->create();

        return [
            'property_id' => $property->id,
            'client_id' => User::factory(),
            'owner_id' => $property->owner_id,
            'last_message_at' => now(),
        ];
    }
}
