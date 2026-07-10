<?php

namespace App\Services;

use App\Enums\VerificationStatus;
use App\Enums\VerificationType;
use App\Models\Property;
use App\Models\User;
use App\Models\Verification;
use App\Repositories\VerificationRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VerificationService
{
    public function __construct(
        private readonly VerificationRepository $verifications,
    ) {}

    /**
     * @return LengthAwarePaginator<int, Verification>
     */
    public function listForUser(User $user, int $perPage = 10): LengthAwarePaginator
    {
        return $this->verifications->paginateForUser($user->id, $perPage);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Verification>
     */
    public function listAdmin(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->verifications->paginateAdmin($filters, $perPage);
    }

    public function find(int $id): Verification
    {
        return $this->verifications->findById($id);
    }

    /**
     * @param  array{type: string, property_id?: int|null, notes?: string|null}  $data
     */
    public function submit(User $user, array $data): Verification
    {
        $type = isset($data['type'])
            ? VerificationType::from($data['type'])
            : VerificationType::Property;

        if ($type === VerificationType::Identity) {
            throw ValidationException::withMessages([
                'type' => ['Seules les vérifications d\'annonces sont acceptées.'],
            ]);
        }

        return $this->submitProperty($user, $data);
    }

    public function approve(User $admin, Verification $verification, ?string $adminNotes = null): Verification
    {
        if (! $verification->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['Cette demande a déjà été traitée.'],
            ]);
        }

        return DB::transaction(function () use ($admin, $verification, $adminNotes) {
            $updated = $this->verifications->update($verification, [
                'status' => VerificationStatus::Approved,
                'admin_notes' => $adminNotes,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);

            if ($updated->type === VerificationType::Identity) {
                $updated->user()->update(['verified_at' => now()]);
            }

            if ($updated->type === VerificationType::Property && $updated->property_id !== null) {
                Property::query()
                    ->whereKey($updated->property_id)
                    ->update(['verified_at' => now()]);
            }

            return $this->verifications->findById($updated->id);
        });
    }

    public function reject(User $admin, Verification $verification, ?string $adminNotes = null): Verification
    {
        if (! $verification->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['Cette demande a déjà été traitée.'],
            ]);
        }

        return $this->verifications->update($verification, [
            'status' => VerificationStatus::Rejected,
            'admin_notes' => $adminNotes,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);
    }

    /**
     * @param  array{property_id?: int|null, notes?: string|null}  $data
     */
    private function submitProperty(User $user, array $data): Verification
    {
        if (! $user->canManageProperties()) {
            throw ValidationException::withMessages([
                'role' => ['Seuls les propriétaires et agences peuvent vérifier une annonce.'],
            ]);
        }

        $propertyId = $data['property_id'] ?? null;

        if ($propertyId === null) {
            throw ValidationException::withMessages([
                'property_id' => ['L\'annonce est requise pour une vérification de bien.'],
            ]);
        }

        $property = Property::query()->find($propertyId);

        if ($property === null) {
            throw ValidationException::withMessages([
                'property_id' => ['Annonce introuvable.'],
            ]);
        }

        if ($property->owner_id !== $user->id && ! $user->hasRoleName(\App\Enums\UserRole::Admin)) {
            throw ValidationException::withMessages([
                'property_id' => ['Vous ne pouvez vérifier que vos propres annonces.'],
            ]);
        }

        if ($property->isVerified()) {
            throw ValidationException::withMessages([
                'property' => ['Cette annonce est déjà vérifiée.'],
            ]);
        }

        if ($this->verifications->hasPendingForUser($user->id, VerificationType::Property, $property->id)) {
            throw ValidationException::withMessages([
                'verification' => ['Une demande de vérification est déjà en cours pour cette annonce.'],
            ]);
        }

        return $this->verifications->create([
            'user_id' => $user->id,
            'property_id' => $property->id,
            'type' => VerificationType::Property,
            'status' => VerificationStatus::Pending,
            'notes' => isset($data['notes']) ? trim((string) $data['notes']) : null,
        ]);
    }
}
