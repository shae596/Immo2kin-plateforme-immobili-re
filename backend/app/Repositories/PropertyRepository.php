<?php

namespace App\Repositories;

use App\Enums\PropertySort;
use App\Enums\PropertyStatus;
use App\Models\Property;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PropertyRepository
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginatePublished(array $filters = [], int $perPage = 12, int $page = 1): LengthAwarePaginator
    {
        return $this->searchQuery($filters, publishedOnly: true)
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateForOwner(int $ownerId, array $filters = [], int $perPage = 12, int $page = 1): LengthAwarePaginator
    {
        $query = $this->searchQuery($filters, publishedOnly: false)
            ->where('owner_id', $ownerId);

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Marqueurs carte (annonces publiées géolocalisées).
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, Property>
     */
    public function mapMarkers(array $filters = [], int $limit = 200): Collection
    {
        return $this->searchQuery($filters, publishedOnly: true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->limit($limit)
            ->get(['id', 'title', 'price', 'currency', 'type', 'listing_type', 'city', 'commune', 'latitude', 'longitude']);
    }

    public function findById(int $id): Property
    {
        $property = Property::query()
            ->with(['images', 'videos', 'amenities', 'owner:id,name,phone,city,commune,verified_at'])
            ->find($id);

        if ($property === null) {
            throw new ModelNotFoundException('Annonce introuvable.');
        }

        return $property;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Property
    {
        return Property::query()->create($attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Property $property, array $attributes): Property
    {
        $property->fill($attributes);
        $property->save();

        return $property->fresh(['images', 'videos', 'amenities', 'owner:id,name']);
    }

    public function delete(Property $property): void
    {
        $property->delete();
    }

    /**
     * @param  array<int>  $amenityIds
     */
    public function syncAmenities(Property $property, array $amenityIds): void
    {
        $property->amenities()->sync($amenityIds);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<Property>
     */
    private function searchQuery(array $filters, bool $publishedOnly): Builder
    {
        $query = Property::query()->with(['images', 'amenities', 'owner:id,name']);

        if ($publishedOnly) {
            $query->where('status', PropertyStatus::Published);
        }

        $this->applyFilters($query, $filters);
        $this->applySort($query, $filters['sort'] ?? PropertySort::Newest->value);

        return $query;
    }

    /**
     * @param  Builder<Property>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term): void {
                $q->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhere('city', 'like', $term)
                    ->orWhere('commune', 'like', $term)
                    ->orWhere('address', 'like', $term);
            });
        }

        if (! empty($filters['city'])) {
            $query->where('city', 'like', '%'.$filters['city'].'%');
        }

        if (! empty($filters['commune'])) {
            $query->where('commune', 'like', '%'.$filters['commune'].'%');
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['listing_type'])) {
            $query->where('listing_type', $filters['listing_type']);
        }

        if (isset($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        if (isset($filters['min_rooms'])) {
            $query->where('rooms', '>=', $filters['min_rooms']);
        }

        if (isset($filters['min_area'])) {
            $query->where('area', '>=', $filters['min_area']);
        }

        if (! empty($filters['has_kitchen'])) {
            $query->where('has_kitchen', true);
        }

        if (! empty($filters['has_living_room'])) {
            $query->where('has_living_room', true);
        }

        if (! empty($filters['has_store'])) {
            $query->where('has_store', true);
        }

        if (! empty($filters['amenity_ids']) && is_array($filters['amenity_ids'])) {
            foreach ($filters['amenity_ids'] as $amenityId) {
                $query->whereHas('amenities', fn (Builder $q) => $q->where('amenities.id', $amenityId));
            }
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['lat'], $filters['lng'], $filters['radius_km'])) {
            $this->applyRadiusFilter(
                $query,
                (float) $filters['lat'],
                (float) $filters['lng'],
                (float) $filters['radius_km'],
            );
        }
    }

    /**
     * @param  Builder<Property>  $query
     */
    private function applyRadiusFilter(Builder $query, float $lat, float $lng, float $radiusKm): void
    {
        $query->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereRaw(
                '(6371 * acos(least(1, greatest(-1, cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))))) <= ?',
                [$lat, $lng, $lat, $radiusKm],
            );
    }

    /**
     * @param  Builder<Property>  $query
     */
    private function applySort(Builder $query, string $sort): void
    {
        $sortEnum = PropertySort::tryFrom($sort) ?? PropertySort::Newest;

        match ($sortEnum) {
            PropertySort::PriceAsc => $query->orderBy('price'),
            PropertySort::PriceDesc => $query->orderByDesc('price'),
            PropertySort::AreaDesc => $query->orderByDesc('area'),
            PropertySort::Newest => $query->latest(),
        };
    }
}
