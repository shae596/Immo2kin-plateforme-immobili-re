<?php

namespace Tests\Feature;

use App\Enums\ListingType;
use App\Enums\ReservationStatus;
use App\Enums\UserRole;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_guest_can_view_availability_for_published_rental(): void
    {
        $property = $this->rentalProperty();

        $this->getJson("/api/v1/properties/{$property->id}/availability")
            ->assertOk()
            ->assertJsonStructure([
                'property_id',
                'blocked_ranges',
                'min_nights',
                'max_advance_days',
            ]);
    }

    public function test_client_can_create_reservation(): void
    {
        $client = $this->client();
        $property = $this->rentalProperty();

        $this->actingAs($client)->postJson("/api/v1/properties/{$property->id}/reservations", [
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(8)->toDateString(),
            'guests' => 2,
            'message' => 'Arrivée vers 14h',
        ])
            ->assertCreated()
            ->assertJsonPath('reservation.status', 'pending');

        $this->assertDatabaseHas('reservations', [
            'property_id' => $property->id,
            'user_id' => $client->id,
            'status' => ReservationStatus::Pending->value,
        ]);
    }

    public function test_cannot_book_overlapping_dates(): void
    {
        $client = $this->client();
        $property = $this->rentalProperty();
        $start = now()->addDays(10)->toDateString();
        $end = now()->addDays(12)->toDateString();

        Reservation::factory()->confirmed()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
            'start_date' => $start,
            'end_date' => $end,
        ]);

        $other = $this->client('other@immo.local');

        $this->actingAs($other)->postJson("/api/v1/properties/{$property->id}/reservations", [
            'start_date' => $start,
            'end_date' => $end,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['dates']);
    }

    public function test_owner_can_confirm_pending_reservation(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        $reservation = Reservation::factory()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
            'status' => ReservationStatus::Pending,
        ]);

        $this->actingAs($owner)->postJson("/api/v1/reservations/{$reservation->id}/confirm")
            ->assertOk()
            ->assertJsonPath('reservation.status', 'confirmed');
    }

    public function test_cannot_reserve_sale_listing(): void
    {
        $client = $this->client();
        $owner = $this->owner();
        $property = Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'listing_type' => ListingType::Sale,
        ]);

        $this->actingAs($client)->postJson("/api/v1/properties/{$property->id}/reservations", [
            'start_date' => now()->addDays(3)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['property']);
    }

    public function test_client_can_list_own_reservations(): void
    {
        $client = $this->client();
        $property = $this->rentalProperty();

        Reservation::factory()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
        ]);

        $this->actingAs($client)->getJson('/api/v1/reservations')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_owner_can_list_received_reservations(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        Reservation::factory()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
        ]);

        $this->actingAs($owner)->getJson('/api/v1/my/properties/reservations')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_owner_can_reject_pending_reservation(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        $reservation = Reservation::factory()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
            'status' => ReservationStatus::Pending,
        ]);

        $this->actingAs($owner)->postJson("/api/v1/reservations/{$reservation->id}/reject")
            ->assertOk()
            ->assertJsonPath('reservation.status', 'rejected');
    }

    public function test_client_can_cancel_pending_reservation(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        $reservation = Reservation::factory()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
            'status' => ReservationStatus::Pending,
        ]);

        $this->actingAs($client)->postJson("/api/v1/reservations/{$reservation->id}/cancel")
            ->assertOk()
            ->assertJsonPath('reservation.status', 'cancelled');
    }

    private function rentalProperty(?User $owner = null): Property
    {
        $owner ??= $this->owner();

        return Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'listing_type' => ListingType::Rent,
            'price' => 900,
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
