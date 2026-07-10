<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConversationSeeder extends Seeder
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
            ->where('status', 'published')
            ->orderBy('id')
            ->first();

        if ($property === null) {
            return;
        }

        Conversation::query()
            ->where('property_id', $property->id)
            ->where('client_id', $client->id)
            ->delete();

        $conversation = Conversation::query()->create([
            'property_id' => $property->id,
            'client_id' => $client->id,
            'owner_id' => $owner->id,
            'last_message_at' => now(),
        ]);

        $conversation->messages()->createMany([
            [
                'user_id' => $client->id,
                'body' => 'Bonjour, cette annonce est-elle toujours disponible ?',
                'created_at' => now()->subMinutes(30),
                'updated_at' => now()->subMinutes(30),
            ],
            [
                'user_id' => $owner->id,
                'body' => 'Bonjour ! Oui, le bien est disponible. Souhaitez-vous réserver ?',
                'created_at' => now()->subMinutes(10),
                'updated_at' => now()->subMinutes(10),
            ],
        ]);
    }
}
