<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Models\Property;
use App\Models\User;
use App\Repositories\RecommendationEventRepository;
use Illuminate\Support\Collection;

class RecommendationService
{
    public function __construct(
        private readonly RecommendationEventRepository $events,
        private readonly AiRecommendationClient $ai,
    ) {}

    /**
     * @return Collection<int, Property>
     */
    public function forUser(?User $user, int $limit = 12): Collection
    {
        $candidates = $this->publishedCandidates();

        if ($candidates->isEmpty()) {
            return collect();
        }

        $candidatePayload = $this->serializeCandidates($candidates);

        if ($user === null) {
            return $this->resolveByIds(
                $this->events->popularPropertyIds($limit),
                $candidates,
                $limit,
            );
        }

        $signals = $this->events->signalsForUser($user->id);

        if ($signals === []) {
            return $this->resolveByIds(
                $this->events->popularPropertyIds($limit),
                $candidates,
                $limit,
            );
        }

        $ranked = $this->ai->rankForUser($signals, $candidatePayload, $limit);

        return $this->resolveRanked($ranked, $candidates);
    }

    /**
     * @return Collection<int, Property>
     */
    public function similar(Property $property, int $limit = 6): Collection
    {
        $property->loadMissing(['amenities']);

        $candidates = $this->publishedCandidates($property->city);

        if ($candidates->isEmpty()) {
            return collect();
        }

        $source = $this->serializeProperty($property);
        $candidatePayload = $this->serializeCandidates($candidates);

        $ranked = $this->ai->rankSimilar($source, $candidatePayload, $limit);

        return $this->resolveRanked($ranked, $candidates);
    }

    /**
     * @return Collection<int, Property>
     */
    private function publishedCandidates(?string $city = null): Collection
    {
        $query = Property::query()
            ->with(['images', 'amenities'])
            ->where('status', PropertyStatus::Published);

        if ($city !== null && $city !== '') {
            $query->where('city', $city);
        }

        return $query->orderByDesc('id')->limit(120)->get();
    }

    /**
     * @param  Collection<int, Property>  $candidates
     * @return list<array<string, mixed>>
     */
    private function serializeCandidates(Collection $candidates): array
    {
        return $candidates
            ->map(fn (Property $p) => $this->serializeProperty($p))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeProperty(Property $property): array
    {
        $summary = app(ReviewService::class)->summaryForProperty($property->id);

        return [
            'id' => $property->id,
            'city' => $property->city,
            'commune' => $property->commune,
            'type' => $property->type->value,
            'listing_type' => $property->listing_type->value,
            'price' => (float) $property->price,
            'is_verified' => $property->isVerified(),
            'rating_average' => $summary['average'] ?? 0,
            'amenity_ids' => $property->relationLoaded('amenities')
                ? $property->amenities->pluck('id')->all()
                : [],
        ];
    }

    /**
     * @param  list<array{property_id: int, score: float}>  $ranked
     * @param  Collection<int, Property>  $candidates
     * @return Collection<int, Property>
     */
    private function resolveRanked(array $ranked, Collection $candidates): Collection
    {
        $byId = $candidates->keyBy('id');
        $ordered = collect();

        foreach ($ranked as $row) {
            $property = $byId->get($row['property_id']);

            if ($property !== null) {
                $ordered->push($property);
            }
        }

        return $ordered;
    }

    /**
     * @param  list<int>  $ids
     * @param  Collection<int, Property>  $candidates
     * @return Collection<int, Property>
     */
    private function resolveByIds(array $ids, Collection $candidates, int $limit): Collection
    {
        if ($ids === []) {
            return $candidates->take($limit);
        }

        $byId = $candidates->keyBy('id');
        $ordered = collect();

        foreach ($ids as $id) {
            $property = $byId->get($id);

            if ($property !== null) {
                $ordered->push($property);
            }
        }

        if ($ordered->count() < $limit) {
            foreach ($candidates as $property) {
                if ($ordered->contains('id', $property->id)) {
                    continue;
                }

                $ordered->push($property);

                if ($ordered->count() >= $limit) {
                    break;
                }
            }
        }

        return $ordered->take($limit);
    }
}
