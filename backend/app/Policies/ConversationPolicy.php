<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->involvesUser($user)
            || $user->hasRole(UserRole::Admin->value);
    }

    public function message(User $user, Conversation $conversation): bool
    {
        return $conversation->involvesUser($user);
    }
}
