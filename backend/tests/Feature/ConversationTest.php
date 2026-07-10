<?php

namespace Tests\Feature;

use App\Enums\ListingType;
use App\Enums\UserRole;
use App\Models\Conversation;
use App\Models\Property;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_client_can_start_conversation_on_published_property(): void
    {
        $client = $this->client();
        $property = $this->rentalProperty();

        $this->actingAs($client)->postJson("/api/v1/properties/{$property->id}/conversations", [
            'body' => 'Bonjour, est-ce disponible ?',
        ])
            ->assertCreated()
            ->assertJsonPath('chat_message.body', 'Bonjour, est-ce disponible ?');

        $this->assertDatabaseHas('conversations', [
            'property_id' => $property->id,
            'client_id' => $client->id,
        ]);
    }

    public function test_owner_cannot_start_conversation_on_own_property(): void
    {
        $owner = $this->owner();
        $property = $this->rentalProperty($owner);

        $this->actingAs($owner)->postJson("/api/v1/properties/{$property->id}/conversations", [
            'body' => 'Test',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['property']);
    }

    public function test_owner_can_reply_in_existing_conversation(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        $conversation = Conversation::factory()->create([
            'property_id' => $property->id,
            'client_id' => $client->id,
            'owner_id' => $owner->id,
        ]);

        $this->actingAs($owner)->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'Réponse du propriétaire',
        ])
            ->assertCreated()
            ->assertJsonPath('chat_message.body', 'Réponse du propriétaire');
    }

    public function test_participants_can_list_messages(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        $conversation = Conversation::factory()->create([
            'property_id' => $property->id,
            'client_id' => $client->id,
            'owner_id' => $owner->id,
        ]);

        $conversation->messages()->create([
            'user_id' => $client->id,
            'body' => 'Message client',
        ]);

        $this->actingAs($client)->getJson("/api/v1/conversations/{$conversation->id}/messages")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_stranger_cannot_access_conversation(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $other = $this->client('other@immo.local');
        $property = $this->rentalProperty($owner);

        $conversation = Conversation::factory()->create([
            'property_id' => $property->id,
            'client_id' => $client->id,
            'owner_id' => $owner->id,
        ]);

        $this->actingAs($other)->getJson("/api/v1/conversations/{$conversation->id}/messages")
            ->assertForbidden();
    }

    public function test_user_sees_own_conversations_in_list(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        Conversation::factory()->create([
            'property_id' => $property->id,
            'client_id' => $client->id,
            'owner_id' => $owner->id,
            'last_message_at' => now(),
        ]);

        $this->actingAs($client)->getJson('/api/v1/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($owner)->getJson('/api/v1/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    private function rentalProperty(?User $owner = null): Property
    {
        $owner ??= $this->owner();

        return Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'listing_type' => ListingType::Rent,
        ]);
    }

    private function owner(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(UserRole::Proprietaire->value);

        return $user;
    }

    private function client(string $email = 'client@immo.local'): User
    {
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
        ]);
        $user->assignRole(UserRole::Client->value);

        return $user;
    }
}
