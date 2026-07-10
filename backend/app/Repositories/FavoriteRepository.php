<?php

namespace App\Repositories;

use App\Models\Favorite;
use App\Models\Property;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class FavoriteRepository
{
    public function paginateForUser(User $user, int $perPage = 12): LengthAwarePaginator
    {
        return Property::query()
            ->whereHas('favorites', fn ($q) => $q->where('user_id', $user->id))
            ->with(['images', 'amenities', 'owner:id,name'])
            ->latest()
            ->paginate($perPage);
    }

    public function exists(User $user, Property $property): bool
    {
        return Favorite::query()
            ->where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->exists();
    }

    public function add(User $user, Property $property): Favorite
    {
        return Favorite::query()->firstOrCreate([
            'user_id' => $user->id,
            'property_id' => $property->id,
        ]);
    }

    public function remove(User $user, Property $property): void
    {
        Favorite::query()
            ->where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->delete();
    }
}
