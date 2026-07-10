<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Property;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoriteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_client_can_add_and_remove_favorite(): void
    {
        $client = User::factory()->create(['email_verified_at' => now()]);
        $client->assignRole(UserRole::Client->value);

        $owner = User::factory()->create(['email_verified_at' => now()]);
        $owner->assignRole(UserRole::Proprietaire->value);

        $property = Property::factory()->published()->create(['owner_id' => $owner->id]);

        $this->actingAs($client)->postJson("/api/v1/favorites/{$property->id}")
            ->assertCreated();

        $this->assertDatabaseHas('favorites', [
            'user_id' => $client->id,
            'property_id' => $property->id,
        ]);

        $this->actingAs($client)->deleteJson("/api/v1/favorites/{$property->id}")
            ->assertOk();

        $this->assertDatabaseMissing('favorites', [
            'user_id' => $client->id,
            'property_id' => $property->id,
        ]);
    }

    public function test_client_can_list_favorites(): void
    {
        $client = User::factory()->create(['email_verified_at' => now()]);
        $client->assignRole(UserRole::Client->value);

        $owner = User::factory()->create(['email_verified_at' => now()]);
        $owner->assignRole(UserRole::Proprietaire->value);

        $property = Property::factory()->published()->create(['owner_id' => $owner->id]);

        $this->actingAs($client)->postJson("/api/v1/favorites/{$property->id}");

        $this->actingAs($client)->getJson('/api/v1/favorites')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_cannot_favorite_draft_property(): void
    {
        $client = User::factory()->create(['email_verified_at' => now()]);
        $client->assignRole(UserRole::Client->value);

        $owner = User::factory()->create(['email_verified_at' => now()]);
        $owner->assignRole(UserRole::Proprietaire->value);

        $property = Property::factory()->draft()->create(['owner_id' => $owner->id]);

        $this->actingAs($client)->postJson("/api/v1/favorites/{$property->id}")
            ->assertUnprocessable();
    }
}
