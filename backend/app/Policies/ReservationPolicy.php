<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Reservation;
use App\Models\User;

class ReservationPolicy
{
    public function view(User $user, Reservation $reservation): bool
    {
        $reservation->loadMissing('property');

        return $user->id === $reservation->user_id
            || $user->id === $reservation->property->owner_id
            || $user->hasRole(UserRole::Admin->value);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function confirm(User $user, Reservation $reservation): bool
    {
        $reservation->loadMissing('property');

        return $user->id === $reservation->property->owner_id
            || $user->hasRole(UserRole::Admin->value);
    }

    public function reject(User $user, Reservation $reservation): bool
    {
        return $this->confirm($user, $reservation);
    }

    public function cancel(User $user, Reservation $reservation): bool
    {
        $reservation->loadMissing('property');

        return $user->id === $reservation->user_id
            || $user->id === $reservation->property->owner_id
            || $user->hasRole(UserRole::Admin->value);
    }

    public function pay(User $user, Reservation $reservation): bool
    {
        return $user->id === $reservation->user_id;
    }
}
