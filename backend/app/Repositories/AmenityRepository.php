<?php

namespace App\Repositories;

use App\Models\Amenity;
use Illuminate\Database\Eloquent\Collection;

class AmenityRepository
{
    /** @return Collection<int, Amenity> */
    public function all(): Collection
    {
        return Amenity::query()->orderBy('name')->get();
    }
}
