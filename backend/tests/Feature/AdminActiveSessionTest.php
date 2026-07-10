<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminActiveSessionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        config(['session.driver' => 'database']);
    }

    public function test_admin_can_list_active_sessions(): void
    {
        $admin = $this->admin();
        $client = User::factory()->create(['email_verified_at' => now()]);
        $client->assignRole(UserRole::Client->value);

        DB::table('sessions')->insert([
            [
                'id' => 'test-session-admin',
                'user_id' => $admin->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Admin Browser',
                'payload' => base64_encode('test'),
                'last_activity' => now()->timestamp,
            ],
            [
                'id' => 'test-session-client',
                'user_id' => $client->id,
                'ip_address' => '127.0.0.2',
                'user_agent' => 'Client Browser',
                'payload' => base64_encode('test'),
                'last_activity' => now()->timestamp,
            ],
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/active-sessions');

        $response->assertOk()->assertJsonCount(2, 'data');

        $emails = collect($response->json('data'))->pluck('user.email')->filter()->values()->all();
        $this->assertContains($admin->email, $emails);
        $this->assertContains($client->email, $emails);
    }

    public function test_non_admin_cannot_list_active_sessions(): void
    {
        $client = User::factory()->create(['email_verified_at' => now()]);
        $client->assignRole(UserRole::Client->value);

        $this->actingAs($client)->getJson('/api/v1/admin/active-sessions')
            ->assertForbidden();
    }

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(UserRole::Admin->value);

        return $user;
    }
}
