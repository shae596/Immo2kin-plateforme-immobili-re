<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $this->seedUser(
            'admin@immo.local',
            [
                'name' => 'Admin Immo2Kin',
                'email_verified_at' => now(),
            ],
            UserRole::Admin,
        );

        $this->seedUser(
            'client@immo.local',
            [
                'name' => 'Client Demo',
                'phone' => '+243900000001',
                'city' => 'Kinshasa',
                'commune' => 'Gombe',
                'email_verified_at' => now(),
            ],
            UserRole::Client,
        );

        $this->seedUser(
            'proprietaire@immo.local',
            [
                'name' => 'Propriétaire Demo',
                'phone' => '+243900000002',
                'city' => 'Kinshasa',
                'commune' => 'Gombe',
                'email_verified_at' => now(),
            ],
            UserRole::Proprietaire,
        );

        $this->seedUser(
            'sharonemulembweng@gmail.com',
            [
                'name' => 'Sharon Mulembwe',
                'email_verified_at' => now(),
            ],
            UserRole::Admin,
        );

        $this->call(AmenitySeeder::class);
        $this->call(PropertySeeder::class);
        $this->call(ExtraPropertySeeder::class);
        $this->call(ReservationSeeder::class);
        $this->call(ConversationSeeder::class);
        $this->call(ReviewSeeder::class);
        $this->call(VerificationSeeder::class);
        $this->call(RecommendationEventSeeder::class);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function seedUser(string $email, array $attributes, UserRole $role): void
    {
        // firstOrCreate : ne réécrase pas phone/nom si l'utilisateur a déjà modifié son profil.
        $user = User::query()->firstOrCreate(
            ['email' => $email],
            array_merge($attributes, [
                'email' => $email,
                'password' => Hash::make('password'),
            ]),
        );

        $user->syncRoles([$role->value]);
    }
}
