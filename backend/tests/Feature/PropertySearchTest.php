<?php

namespace Tests\Feature;

use App\Enums\ListingType;
use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Enums\UserRole;
use App\Models\Property;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertySearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_can_search_by_keyword(): void
    {
        $owner = $this->createOwner();
        Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'title' => 'Villa exclusive Ngaliema',
            'city' => 'Kinshasa',
            'commune' => 'Ngaliema',
        ]);
        Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'title' => 'Studio Lingwala',
            'city' => 'Kinshasa',
            'commune' => 'Lingwala',
        ]);

        $this->getJson('/api/v1/properties?q=Ngaliema')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_can_sort_by_price_ascending(): void
    {
        $owner = $this->createOwner();
        Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'price' => 900,
            'title' => 'Cher',
        ]);
        Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'price' => 400,
            'title' => 'Bon marché',
        ]);

        $response = $this->getJson('/api/v1/properties?sort=price_asc');

        $response->assertOk()
            ->assertJsonPath('data.0.price', '400.00');
    }

    public function test_can_filter_by_listing_type_sale(): void
    {
        $owner = $this->createOwner();
        Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'listing_type' => ListingType::Rent,
        ]);
        Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'listing_type' => ListingType::Sale,
            'price' => 200000,
        ]);

        $this->getJson('/api/v1/properties?listing_type=sale')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_map_endpoint_returns_geolocated_markers(): void
    {
        $owner = $this->createOwner();
        Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'latitude' => -4.32,
            'longitude' => 15.31,
        ]);
        Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'latitude' => null,
            'longitude' => null,
        ]);

        $this->getJson('/api/v1/properties/map')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure([
                'data' => [
                    ['id', 'title', 'latitude', 'longitude'],
                ],
            ]);
    }

    public function test_pagination_uses_page_parameter(): void
    {
        $owner = $this->createOwner();
        for ($i = 0; $i < 15; $i++) {
            Property::factory()->published()->create(['owner_id' => $owner->id]);
        }

        $this->getJson('/api/v1/properties?per_page=10&page=2')
            ->assertOk()
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonCount(5, 'data');
    }

    private function createOwner(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(UserRole::Proprietaire->value);

        return $user;
    }
}
