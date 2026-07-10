<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Enums\VerificationType;
use App\Models\Property;
use App\Models\User;
use App\Models\Verification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_identity_verification_is_no_longer_accepted(): void
    {
        $owner = $this->owner();

        $this->actingAs($owner)->postJson('/api/v1/verifications', [
            'type' => VerificationType::Identity->value,
            'property_id' => Property::factory()->published()->create(['owner_id' => $owner->id])->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['type']);
    }

    public function test_owner_can_submit_property_verification(): void
    {
        $owner = $this->owner();
        $property = Property::factory()->published()->create(['owner_id' => $owner->id]);

        $this->actingAs($owner)->postJson('/api/v1/verifications', [
            'property_id' => $property->id,
            'notes' => 'Titre foncier joint.',
        ])
            ->assertCreated()
            ->assertJsonPath('verification.type', VerificationType::Property->value)
            ->assertJsonPath('verification.property_id', $property->id);
    }

    public function test_client_cannot_submit_property_verification(): void
    {
        $client = $this->client();
        $property = Property::factory()->published()->create();

        $this->actingAs($client)->postJson('/api/v1/verifications', [
            'property_id' => $property->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);
    }

    public function test_admin_can_list_pending_verifications(): void
    {
        $admin = $this->admin();
        $owner = $this->owner();
        $property = Property::factory()->published()->create(['owner_id' => $owner->id]);

        Verification::factory()->create([
            'user_id' => $owner->id,
            'property_id' => $property->id,
            'type' => VerificationType::Property,
            'status' => VerificationStatus::Pending,
            'notes' => 'Demande test admin',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/verifications?status=pending');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', VerificationType::Property->value)
            ->assertJsonPath('data.0.notes', 'Demande test admin');
    }

    public function test_admin_can_approve_property_verification(): void
    {
        $owner = $this->owner();
        $admin = $this->admin();
        $property = Property::factory()->published()->create(['owner_id' => $owner->id]);

        $verification = Verification::factory()->create([
            'user_id' => $owner->id,
            'property_id' => $property->id,
            'type' => VerificationType::Property,
        ]);

        $this->actingAs($admin)->postJson("/api/v1/admin/verifications/{$verification->id}/approve", [
            'admin_notes' => 'Annonce conforme.',
        ])
            ->assertOk()
            ->assertJsonPath('verification.status', VerificationStatus::Approved->value);

        $property->refresh();
        $this->assertNotNull($property->verified_at);
    }

    public function test_admin_can_reject_verification(): void
    {
        $owner = $this->owner();
        $admin = $this->admin();

        $verification = Verification::factory()->create([
            'user_id' => $owner->id,
            'type' => VerificationType::Property,
        ]);

        $this->actingAs($admin)->postJson("/api/v1/admin/verifications/{$verification->id}/reject", [
            'admin_notes' => 'Documents incomplets.',
        ])
            ->assertOk()
            ->assertJsonPath('verification.status', VerificationStatus::Rejected->value);
    }

    public function test_owner_sees_own_verifications(): void
    {
        $owner = $this->owner();

        Verification::factory()->create([
            'user_id' => $owner->id,
            'type' => VerificationType::Property,
        ]);

        $this->actingAs($owner)->getJson('/api/v1/verifications')
            ->assertOk()
            ->assertJsonCount(1, 'data');
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

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(UserRole::Admin->value);

        return $user;
    }
}
