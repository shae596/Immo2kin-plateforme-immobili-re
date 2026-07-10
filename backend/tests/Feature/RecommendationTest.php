<?php

namespace Tests\Feature;

use App\Enums\ListingType;
use App\Enums\RecommendationEventType;
use App\Enums\UserRole;
use App\Models\Property;
use App\Models\RecommendationEvent;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RecommendationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        config(['services.ai.url' => '']);
    }

    public function test_guest_can_fetch_popular_recommendations(): void
    {
        $property = $this->publishedRental();

        RecommendationEvent::factory()->create([
            'property_id' => $property->id,
            'event_type' => RecommendationEventType::View,
        ]);

        $this->getJson('/api/v1/recommendations')
            ->assertOk()
            ->assertJsonPath('meta.personalized', false)
            ->assertJsonPath('meta.source', 'popular');
    }

    public function test_authenticated_user_gets_personalized_recommendations(): void
    {
        $client = $this->client();
        $target = $this->publishedRental(['commune' => 'Gombe', 'city' => 'Kinshasa']);
        $other = $this->publishedRental(['commune' => 'Limete', 'city' => 'Kinshasa']);

        RecommendationEvent::factory()->create([
            'user_id' => $client->id,
            'property_id' => $target->id,
            'event_type' => RecommendationEventType::Favorite,
        ]);

        $response = $this->actingAs($client)->getJson('/api/v1/recommendations');

        $response
            ->assertOk()
            ->assertJsonPath('meta.personalized', true);

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertNotContains($target->id, $ids);
        $this->assertContains($other->id, $ids);
    }

    public function test_similar_properties_endpoint(): void
    {
        $source = $this->publishedRental(['commune' => 'Gombe', 'type' => 'appartement']);
        $similar = $this->publishedRental(['commune' => 'Gombe', 'type' => 'appartement']);
        $this->publishedRental(['commune' => 'Limete', 'type' => 'terrain']);

        $this->getJson("/api/v1/properties/{$source->id}/similar")
            ->assertOk()
            ->assertJsonPath('meta.property_id', $source->id);

        $ids = collect($this->getJson("/api/v1/properties/{$source->id}/similar")->json('data'))
            ->pluck('id')
            ->all();

        $this->assertContains($similar->id, $ids);
        $this->assertNotContains($source->id, $ids);
    }

    public function test_user_can_record_recommendation_event(): void
    {
        $client = $this->client();
        $property = $this->publishedRental();

        $this->actingAs($client)->postJson('/api/v1/recommendation-events', [
            'event_type' => RecommendationEventType::Search->value,
            'metadata' => ['city' => 'Kinshasa'],
        ])
            ->assertCreated();

        $this->assertDatabaseHas('recommendation_events', [
            'user_id' => $client->id,
            'event_type' => RecommendationEventType::Search->value,
        ]);
    }

    public function test_property_view_records_event_for_authenticated_user(): void
    {
        $client = $this->client();
        $property = $this->publishedRental();

        $this->actingAs($client)->getJson("/api/v1/properties/{$property->id}")
            ->assertOk();

        $this->assertDatabaseHas('recommendation_events', [
            'user_id' => $client->id,
            'property_id' => $property->id,
            'event_type' => RecommendationEventType::View->value,
        ]);
    }

    public function test_uses_ai_service_when_available(): void
    {
        config([
            'services.ai.url' => 'http://ai.test',
            'services.ai.key' => 'test-key',
        ]);

        $client = $this->client();
        $viewed = $this->publishedRental();
        $recommended = $this->publishedRental();

        RecommendationEvent::factory()->create([
            'user_id' => $client->id,
            'property_id' => $viewed->id,
            'event_type' => RecommendationEventType::View,
        ]);

        Http::fake([
            'http://ai.test/api/v1/recommendations/rank' => Http::response([
                'data' => [
                    ['property_id' => $recommended->id, 'score' => 9.5],
                ],
            ]),
        ]);

        $this->actingAs($client)->getJson('/api/v1/recommendations')
            ->assertOk()
            ->assertJsonPath('data.0.id', $recommended->id);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function publishedRental(array $overrides = []): Property
    {
        $owner = User::factory()->create(['email_verified_at' => now()]);
        $owner->assignRole(UserRole::Proprietaire->value);

        return Property::factory()->published()->create(array_merge([
            'owner_id' => $owner->id,
            'listing_type' => ListingType::Rent,
            'city' => 'Kinshasa',
            'commune' => 'Gombe',
        ], $overrides));
    }

    private function client(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(UserRole::Client->value);

        return $user;
    }
}
