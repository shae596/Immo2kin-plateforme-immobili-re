<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    public function view(?User $user, Property $property): bool
    {
        if ($property->isPublished()) {
            return true;
        }

        if ($user === null) {
            return false;
        }

        return $this->isOwnerOrAdmin($user, $property);
    }

    public function create(User $user): bool
    {
        return $user->canManageProperties();
    }

    public function update(User $user, Property $property): bool
    {
        return $this->isOwnerOrAdmin($user, $property);
    }

    public function delete(User $user, Property $property): bool
    {
        return $this->isOwnerOrAdmin($user, $property);
    }

    private function isOwnerOrAdmin(User $user, Property $property): bool
    {
        return $user->id === $property->owner_id
            || $user->hasRole(UserRole::Admin->value);
    }
}
