<?php

namespace Tests\Feature;

use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Enums\UserRole;
use App\Models\Amenity;
use App\Models\Property;
use App\Models\User;
use Database\Seeders\AmenitySeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PropertyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->seed(AmenitySeeder::class);
    }

    public function test_guest_can_list_published_properties(): void
    {
        $owner = $this->createOwner();
        Property::factory()->published()->create(['owner_id' => $owner->id]);
        Property::factory()->draft()->create(['owner_id' => $owner->id]);

        $response = $this->getJson('/api/v1/properties');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_owner_can_create_property(): void
    {
        $owner = $this->createOwner();
        $amenity = Amenity::query()->first();

        $response = $this->actingAs($owner)->postJson('/api/v1/properties', [
            'title' => 'Nouvelle annonce',
            'description' => 'Description test.',
            'price' => 500,
            'city' => 'Kinshasa',
            'commune' => 'Gombe',
            'type' => PropertyType::Appartement->value,
            'amenity_ids' => [$amenity->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('property.title', 'Nouvelle annonce');

        $this->assertDatabaseHas('properties', [
            'title' => 'Nouvelle annonce',
            'owner_id' => $owner->id,
            'latitude' => -4.3120,
            'longitude' => 15.3050,
        ]);
    }

    public function test_create_property_geolocates_from_commune_on_map(): void
    {
        $owner = $this->createOwner();

        $this->actingAs($owner)->postJson('/api/v1/properties', [
            'title' => 'Annonce carte',
            'price' => 600,
            'city' => 'Kinshasa',
            'commune' => 'Ngaliema',
            'type' => PropertyType::Appartement->value,
            'status' => PropertyStatus::Published->value,
        ])->assertCreated();

        $this->getJson('/api/v1/properties/map')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Annonce carte');
    }

    public function test_update_property_backfills_coordinates_when_missing(): void
    {
        $owner = $this->createOwner();
        $property = Property::factory()->create([
            'owner_id' => $owner->id,
            'commune' => 'Limete',
            'latitude' => null,
            'longitude' => null,
            'status' => PropertyStatus::Published,
        ]);

        $this->actingAs($owner)->putJson("/api/v1/properties/{$property->id}", [
            'title' => 'Titre mis à jour',
        ])->assertOk();

        $property->refresh();

        $this->assertSame('-4.3500000', (string) $property->latitude);
        $this->assertSame('15.3350000', (string) $property->longitude);
    }

    public function test_client_cannot_create_property(): void
    {
        $client = User::factory()->create(['email_verified_at' => now()]);
        $client->assignRole(UserRole::Client->value);

        $this->actingAs($client)->postJson('/api/v1/properties', [
            'title' => 'Tentative',
            'price' => 500,
            'city' => 'Kinshasa',
            'commune' => 'Gombe',
            'type' => PropertyType::Appartement->value,
        ])->assertForbidden();
    }

    public function test_owner_can_update_own_property(): void
    {
        $owner = $this->createOwner();
        $property = Property::factory()->create(['owner_id' => $owner->id]);

        $this->actingAs($owner)->putJson("/api/v1/properties/{$property->id}", [
            'title' => 'Titre modifié',
            'status' => PropertyStatus::Published->value,
        ])->assertOk()
            ->assertJsonPath('property.title', 'Titre modifié');
    }

    public function test_guest_cannot_view_draft_property(): void
    {
        $owner = $this->createOwner();
        $property = Property::factory()->draft()->create(['owner_id' => $owner->id]);

        $this->getJson("/api/v1/properties/{$property->id}")
            ->assertForbidden();
    }

    public function test_owner_can_upload_image(): void
    {
        Storage::fake('public');

        $owner = $this->createOwner();
        $property = Property::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson(
            "/api/v1/properties/{$property->id}/images",
            ['image' => UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg')],
        );

        $response->assertCreated();
        $this->assertDatabaseCount('property_images', 1);
    }

    public function test_owner_can_upload_png_image(): void
    {
        Storage::fake('public');

        $owner = $this->createOwner();
        $property = Property::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)->post(
            "/api/v1/properties/{$property->id}/images",
            [
                'image' => UploadedFile::fake()->image('photo.png', 800, 600)->size(500),
                'sort_order' => 0,
            ],
        );

        $response->assertCreated();
        $this->assertDatabaseCount('property_images', 1);
    }

    private function createOwner(): User
    {
        $owner = User::factory()->create(['email_verified_at' => now()]);
        $owner->assignRole(UserRole::Proprietaire->value);

        return $owner;
    }
}
