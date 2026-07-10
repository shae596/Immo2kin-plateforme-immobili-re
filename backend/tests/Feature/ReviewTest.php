<?php

namespace Tests\Feature;

use App\Enums\ListingType;
use App\Enums\ReservationStatus;
use App\Enums\UserRole;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_guest_can_list_property_reviews(): void
    {
        $property = $this->rentalProperty();
        Review::factory()->create([
            'property_id' => $property->id,
            'user_id' => $this->client()->id,
            'rating' => 4,
            'comment' => 'Très bien',
        ]);

        $this->getJson("/api/v1/properties/{$property->id}/reviews")
            ->assertOk()
            ->assertJsonPath('meta.summary.count', 1)
            ->assertJsonPath('meta.summary.average', 4)
            ->assertJsonCount(1, 'data');
    }

    public function test_client_can_review_after_completed_stay(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        $this->createCompletedReservation($client, $property);

        $this->actingAs($client)->postJson("/api/v1/properties/{$property->id}/reviews", [
            'rating' => 5,
            'comment' => 'Parfait',
        ])
            ->assertCreated()
            ->assertJsonPath('review.rating', 5);

        $this->assertDatabaseHas('reviews', [
            'property_id' => $property->id,
            'user_id' => $client->id,
            'rating' => 5,
        ]);
    }

    public function test_client_cannot_review_without_completed_stay(): void
    {
        $client = $this->client();
        $property = $this->rentalProperty();

        $this->actingAs($client)->postJson("/api/v1/properties/{$property->id}/reviews", [
            'rating' => 4,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reservation']);
    }

    public function test_owner_cannot_review_own_property(): void
    {
        $owner = $this->owner();
        $property = $this->rentalProperty($owner);

        $this->createCompletedReservation($owner, $property);

        $this->actingAs($owner)->postJson("/api/v1/properties/{$property->id}/reviews", [
            'rating' => 5,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['property']);
    }

    public function test_client_cannot_review_twice(): void
    {
        $client = $this->client();
        $property = $this->rentalProperty();

        $this->createCompletedReservation($client, $property);

        $this->actingAs($client)->postJson("/api/v1/properties/{$property->id}/reviews", [
            'rating' => 5,
        ])->assertCreated();

        $this->actingAs($client)->postJson("/api/v1/properties/{$property->id}/reviews", [
            'rating' => 3,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['property']);
    }

    public function test_author_can_update_and_delete_review(): void
    {
        $client = $this->client();
        $property = $this->rentalProperty();
        $reservation = $this->createCompletedReservation($client, $property);

        $review = Review::factory()->forReservation($reservation)->create([
            'rating' => 3,
            'comment' => 'Correct',
        ]);

        $this->actingAs($client)->putJson("/api/v1/reviews/{$review->id}", [
            'rating' => 4,
            'comment' => 'Mieux que prévu',
        ])
            ->assertOk()
            ->assertJsonPath('review.rating', 4);

        $this->actingAs($client)->deleteJson("/api/v1/reviews/{$review->id}")
            ->assertOk();

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    private function rentalProperty(?User $owner = null): Property
    {
        $owner ??= $this->owner();

        return Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'listing_type' => ListingType::Rent,
        ]);
    }

    private function createCompletedReservation(User $client, Property $property): Reservation
    {
        return Reservation::factory()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
            'status' => ReservationStatus::Confirmed,
            'start_date' => now()->subDays(10),
            'end_date' => now()->subDays(3),
        ]);
    }

    private function owner(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(UserRole::Proprietaire->value);

        return $user;
    }

    private function client(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(UserRole::Client->value);

        return $user;
    }
}
