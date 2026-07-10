<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        config(['session.driver' => 'database']);
    }

    public function test_admin_can_fetch_stats(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->getJson('/api/v1/admin/stats')
            ->assertOk()
            ->assertJsonStructure([
                'stats' => [
                    'users' => ['total', 'by_role'],
                    'properties',
                    'reservations',
                    'payments',
                    'active_sessions',
                ],
            ]);
    }

    public function test_admin_can_manage_users(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Nouveau Client',
            'email' => 'newclient@immo.local',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'client',
            'email_verified' => true,
        ])
            ->assertCreated()
            ->assertJsonPath('user.email', 'newclient@immo.local');

        $this->actingAs($admin)->getJson('/api/v1/admin/users?role=client')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_non_admin_cannot_access_admin_stats(): void
    {
        $client = User::factory()->create(['email_verified_at' => now()]);
        $client->assignRole(UserRole::Client->value);

        $this->actingAs($client)->getJson('/api/v1/admin/stats')->assertForbidden();
    }

    public function test_active_sessions_lists_all_roles(): void
    {
        $admin = $this->admin();
        $client = User::factory()->create(['email_verified_at' => now()]);
        $client->assignRole(UserRole::Client->value);
        $owner = User::factory()->create(['email_verified_at' => now()]);
        $owner->assignRole(UserRole::Proprietaire->value);

        DB::table('sessions')->insert([
            [
                'id' => 'sess-admin',
                'user_id' => $admin->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Admin Browser',
                'payload' => base64_encode('test'),
                'last_activity' => now()->timestamp,
            ],
            [
                'id' => 'sess-client',
                'user_id' => $client->id,
                'ip_address' => '127.0.0.2',
                'user_agent' => 'Client Browser',
                'payload' => base64_encode('test'),
                'last_activity' => now()->timestamp,
            ],
            [
                'id' => 'sess-owner',
                'user_id' => null,
                'ip_address' => '127.0.0.3',
                'user_agent' => 'Owner Browser',
                'payload' => base64_encode(serialize([
                    'login_web_'.sha1(\Illuminate\Auth\SessionGuard::class) => $owner->id,
                ])),
                'last_activity' => now()->timestamp,
            ],
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/active-sessions');

        $response->assertOk()->assertJsonPath('meta.total', 3);

        $emails = collect($response->json('data'))->pluck('user.email')->filter()->values()->all();
        $this->assertContains($admin->email, $emails);
        $this->assertContains($client->email, $emails);
        $this->assertContains($owner->email, $emails);
    }

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(UserRole::Admin->value);

        return $user;
    }
}
