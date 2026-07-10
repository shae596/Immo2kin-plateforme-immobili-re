<?php

namespace App\Repositories;

use App\Enums\VerificationStatus;
use App\Enums\VerificationType;
use App\Models\Verification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class VerificationRepository
{
    public function findById(int $id): Verification
    {
        $verification = Verification::query()
            ->with(['user:id,name,email', 'property:id,title', 'reviewer:id,name'])
            ->find($id);

        if ($verification === null) {
            throw new ModelNotFoundException('Demande de vérification introuvable.');
        }

        return $verification;
    }

    /**
     * @return LengthAwarePaginator<int, Verification>
     */
    public function paginateForUser(int $userId, int $perPage = 10): LengthAwarePaginator
    {
        return Verification::query()
            ->where('user_id', $userId)
            ->with(['property:id,title'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * @return LengthAwarePaginator<int, Verification>
     */
    public function paginateAdmin(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Verification::query()
            ->with(['user:id,name,email', 'property:id,title'])
            ->orderByDesc('created_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        return $query->paginate($perPage);
    }

    public function hasPendingForUser(int $userId, VerificationType $type, ?int $propertyId = null): bool
    {
        $query = Verification::query()
            ->where('user_id', $userId)
            ->where('type', $type)
            ->where('status', VerificationStatus::Pending);

        if ($propertyId !== null) {
            $query->where('property_id', $propertyId);
        } else {
            $query->whereNull('property_id');
        }

        return $query->exists();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Verification
    {
        return Verification::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Verification $verification, array $data): Verification
    {
        $verification->update($data);

        return $this->findById($verification->id);
    }
}
