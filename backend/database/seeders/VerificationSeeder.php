<?php

namespace Database\Seeders;

use App\Enums\VerificationStatus;
use App\Enums\VerificationType;
use App\Models\Property;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Database\Seeder;

class VerificationSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->where('email', 'proprietaire@immo.local')->first();

        if ($owner === null) {
            return;
        }

        $property = Property::query()
            ->where('owner_id', $owner->id)
            ->where('status', 'published')
            ->whereNull('verified_at')
            ->orderBy('id')
            ->skip(1)
            ->first();

        if ($property !== null) {
            Verification::query()->updateOrCreate(
                [
                    'user_id' => $owner->id,
                    'property_id' => $property->id,
                    'type' => VerificationType::Property,
                    'status' => VerificationStatus::Pending,
                ],
                [
                    'notes' => 'Titre foncier et photos du bien — demande démo.',
                ],
            );
        }
    }
}
