<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Models\Property;
use App\Models\User;
use App\Repositories\PropertyRepository;
use App\Support\KinshasaCommuneCoordinates;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class PropertyService
{
    public function __construct(
        private readonly PropertyRepository $properties,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublished(array $filters = [], int $perPage = 12, int $page = 1): LengthAwarePaginator
    {
        return $this->properties->paginatePublished($filters, $perPage, $page);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Collection<int, Property>
     */
    public function mapMarkers(array $filters = []): Collection
    {
        return $this->properties->mapMarkers($filters);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listForOwner(User $owner, array $filters = [], int $perPage = 12, int $page = 1): LengthAwarePaginator
    {
        return $this->properties->paginateForOwner($owner->id, $filters, $perPage, $page);
    }

    public function find(int $id): Property
    {
        return $this->properties->findById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $owner, array $data): Property
    {
        if (! $owner->canManageProperties()) {
            throw ValidationException::withMessages([
                'role' => ['Seuls les propriétaires, agences et administrateurs peuvent publier des annonces.'],
            ]);
        }

        $amenityIds = $data['amenity_ids'] ?? [];
        unset($data['amenity_ids']);

        $data['owner_id'] = $owner->id;
        $data['status'] = $data['status'] ?? PropertyStatus::Draft->value;
        $data = $this->applyCoordinatesFromCommune($data);

        $property = $this->properties->create($data);

        if ($amenityIds !== []) {
            $this->properties->syncAmenities($property, $amenityIds);
        }

        return $this->properties->findById($property->id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Property $property, array $data): Property
    {
        $amenityIds = $data['amenity_ids'] ?? null;
        unset($data['amenity_ids']);

        $data = $this->applyCoordinatesFromCommune($data, $property);

        $property = $this->properties->update($property, $data);

        if ($amenityIds !== null) {
            $this->properties->syncAmenities($property, $amenityIds);
        }

        return $this->properties->findById($property->id);
    }

    public function delete(Property $property): void
    {
        $this->properties->delete($property);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function applyCoordinatesFromCommune(array $data, ?Property $existing = null): array
    {
        if (
            array_key_exists('latitude', $data)
            && array_key_exists('longitude', $data)
            && $data['latitude'] !== null
            && $data['longitude'] !== null
        ) {
            return $data;
        }

        $commune = $data['commune'] ?? $existing?->commune;
        $communeChanged = $existing !== null
            && array_key_exists('commune', $data)
            && $data['commune'] !== $existing->commune;

        $missingCoords = $existing === null
            || $existing->latitude === null
            || $existing->longitude === null;

        if (! $communeChanged && ! $missingCoords) {
            return $data;
        }

        $coords = KinshasaCommuneCoordinates::forCommune($commune);

        if ($coords !== null) {
            $data['latitude'] = $coords['latitude'];
            $data['longitude'] = $coords['longitude'];
        }

        return $data;
    }
}
