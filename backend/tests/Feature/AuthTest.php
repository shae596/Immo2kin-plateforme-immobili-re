<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_user_can_register_with_client_role(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Jean Dupont',
            'email' => 'jean@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role' => UserRole::Client->value,
            'phone' => '+243900000099',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'jean@example.com')
            ->assertJsonPath('user.roles.0', UserRole::Client->value);

        $this->assertDatabaseHas('users', [
            'email' => 'jean@example.com',
        ]);
    }

    public function test_user_can_login_and_fetch_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => Hash::make('Password1!'),
            'email_verified_at' => now(),
        ]);
        $user->assignRole(UserRole::Client->value);

        $this->get('/sanctum/csrf-cookie');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password1!',
        ])->assertOk()
            ->assertJsonPath('user.email', 'login@example.com');

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'login@example.com');
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $user->assignRole(UserRole::Proprietaire->value);

        $response = $this->actingAs($user)->putJson('/api/v1/auth/profile', [
            'name' => 'Nouveau Nom',
            'city' => 'Kinshasa',
            'commune' => 'Gombe',
            'bio' => 'Propriétaire vérifié.',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.name', 'Nouveau Nom')
            ->assertJsonPath('user.city', 'Kinshasa');
    }

    public function test_profile_phone_is_normalized_for_drc_local_format(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'phone' => '+243900000002',
        ]);
        $user->assignRole(UserRole::Proprietaire->value);

        $response = $this->actingAs($user)->putJson('/api/v1/auth/profile', [
            'phone' => '0892905498',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.phone', '+243892905498');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone' => '+243892905498',
        ]);
    }

    public function test_guest_cannot_access_me_endpoint(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_forgot_password_sends_notification_for_existing_user(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'email_verified_at' => now(),
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'reset@example.com',
        ])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }
}
