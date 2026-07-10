<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Verification;

class VerificationPolicy
{
    public function view(User $user, Verification $verification): bool
    {
        return $verification->user_id === $user->id
            || $user->hasRole(UserRole::Admin->value);
    }
}
