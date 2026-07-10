<?php

namespace App\Services;

use App\Models\Property;
use App\Models\User;
use App\Repositories\FavoriteRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class FavoriteService
{
    public function __construct(
        private readonly FavoriteRepository $favorites,
    ) {}

    public function list(User $user, int $perPage = 12): LengthAwarePaginator
    {
        return $this->favorites->paginateForUser($user, $perPage);
    }

    public function add(User $user, Property $property): void
    {
        if (! $property->isPublished()) {
            throw ValidationException::withMessages([
                'property' => ['Impossible d\'ajouter une annonce non publiée aux favoris.'],
            ]);
        }

        $this->favorites->add($user, $property);
    }

    public function remove(User $user, Property $property): void
    {
        $this->favorites->remove($user, $property);
    }

    public function isFavorited(User $user, Property $property): bool
    {
        return $this->favorites->exists($user, $property);
    }
}
