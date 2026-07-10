<?php

namespace Tests\Feature;

use App\Enums\PaymentStatus;
use App\Enums\ReservationStatus;
use App\Enums\UserRole;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_client_can_initiate_stripe_payment_for_confirmed_reservation(): void
    {
        $reservation = $this->confirmedReservation();

        $response = $this->actingAs($reservation->user)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/stripe")
            ->assertCreated()
            ->assertJsonPath('payment.status', 'pending')
            ->assertJsonPath('payment.method', 'stripe');

        $this->assertNotEmpty($response->json('client_secret'));
        $this->assertDatabaseHas('payments', [
            'reservation_id' => $reservation->id,
            'user_id' => $reservation->user_id,
            'status' => PaymentStatus::Pending->value,
        ]);
    }

    public function test_client_can_confirm_stripe_payment_with_fake_gateway(): void
    {
        $reservation = $this->confirmedReservation();

        $init = $this->actingAs($reservation->user)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/stripe")
            ->assertCreated();

        $paymentId = $init->json('payment.id');

        $this->actingAs($reservation->user)
            ->postJson("/api/v1/payments/{$paymentId}/stripe/confirm")
            ->assertOk()
            ->assertJsonPath('payment.status', 'paid');

        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
        ]);
        $this->assertNotNull(Reservation::query()->find($reservation->id)?->paid_at);
    }

    public function test_cannot_pay_pending_reservation(): void
    {
        $owner = $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        $reservation = Reservation::factory()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
            'status' => ReservationStatus::Pending,
        ]);

        $this->actingAs($client)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/stripe")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reservation']);
    }

    public function test_cannot_pay_twice(): void
    {
        $reservation = $this->confirmedReservation(paid: true);

        $this->actingAs($reservation->user)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/stripe")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['payment']);
    }

    public function test_client_can_initiate_mobile_money_payment(): void
    {
        config(['services.mobile_money.auto_confirm' => false]);

        $reservation = $this->confirmedReservation();

        $this->actingAs($reservation->user)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/mobile-money", [
                'phone' => '+243900000001',
                'provider' => 'orange',
            ])
            ->assertCreated()
            ->assertJsonPath('payment.status', 'processing')
            ->assertJsonPath('payment.method', 'mobile_money')
            ->assertJsonStructure(['instructions']);
    }

    public function test_client_can_confirm_mobile_money_payment(): void
    {
        config(['services.mobile_money.auto_confirm' => false]);

        $reservation = $this->confirmedReservation();

        $init = $this->actingAs($reservation->user)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/mobile-money", [
                'phone' => '+243900000001',
                'provider' => 'airtel',
            ])
            ->assertCreated();

        $paymentId = $init->json('payment.id');

        $this->actingAs($reservation->user)
            ->postJson("/api/v1/payments/{$paymentId}/mobile-money/confirm")
            ->assertOk()
            ->assertJsonPath('payment.status', 'paid');

        $this->assertNotNull(Reservation::query()->find($reservation->id)?->paid_at);
    }

    public function test_stripe_webhook_marks_payment_paid(): void
    {
        $reservation = $this->confirmedReservation();

        $init = $this->actingAs($reservation->user)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/stripe")
            ->assertCreated();

        $intentId = Payment::query()->find($init->json('payment.id'))?->provider_payment_id;
        $this->assertNotNull($intentId);

        $payload = json_encode([
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => $intentId,
                ],
            ],
        ]);

        $this->call(
            'POST',
            '/api/v1/webhooks/stripe',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            $payload,
        )
            ->assertOk()
            ->assertJsonPath('received', true);

        $this->assertNotNull(Reservation::query()->find($reservation->id)?->paid_at);
    }

    public function test_owner_cannot_initiate_payment_for_guest_reservation(): void
    {
        $owner = $this->owner();
        $reservation = $this->confirmedReservation($owner);

        $this->actingAs($owner)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/stripe")
            ->assertForbidden();
    }

    public function test_client_can_view_own_payment(): void
    {
        $reservation = $this->confirmedReservation();

        $init = $this->actingAs($reservation->user)
            ->postJson("/api/v1/reservations/{$reservation->id}/payments/stripe")
            ->assertCreated();

        $paymentId = $init->json('payment.id');

        $this->actingAs($reservation->user)
            ->getJson("/api/v1/payments/{$paymentId}")
            ->assertOk()
            ->assertJsonPath('payment.id', $paymentId);
    }

    private function confirmedReservation(?User $owner = null, bool $paid = false): Reservation
    {
        $owner ??= $this->owner();
        $client = $this->client();
        $property = $this->rentalProperty($owner);

        return Reservation::factory()->confirmed()->create([
            'property_id' => $property->id,
            'user_id' => $client->id,
            'paid_at' => $paid ? now() : null,
        ]);
    }

    private function rentalProperty(User $owner): Property
    {
        return Property::factory()->published()->create([
            'owner_id' => $owner->id,
            'listing_type' => \App\Enums\ListingType::Rent,
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
