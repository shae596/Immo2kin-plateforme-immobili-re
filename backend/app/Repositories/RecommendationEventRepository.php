<?php

namespace App\Repositories;

use App\Enums\RecommendationEventType;
use App\Models\RecommendationEvent;
use App\Models\User;
use Illuminate\Support\Collection;

class RecommendationEventRepository
{
    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function record(
        ?User $user,
        ?int $propertyId,
        RecommendationEventType $type,
        ?array $metadata = null,
    ): RecommendationEvent {
        return RecommendationEvent::query()->create([
            'user_id' => $user?->id,
            'property_id' => $propertyId,
            'event_type' => $type,
            'metadata' => $metadata,
        ]);
    }

    /**
     * @return Collection<int, RecommendationEvent>
     */
    public function recentForUser(int $userId, int $limit = 100): Collection
    {
        return RecommendationEvent::query()
            ->where('user_id', $userId)
            ->whereNotNull('property_id')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * @return list<array{property_id: int, event_type: string, weight: int}>
     */
    public function signalsForUser(int $userId, int $limit = 80): array
    {
        return $this->recentForUser($userId, $limit)
            ->map(fn (RecommendationEvent $event) => [
                'property_id' => (int) $event->property_id,
                'event_type' => $event->event_type->value,
                'weight' => $event->event_type->weight(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<int>
     */
    public function popularPropertyIds(int $limit = 12): array
    {
        return RecommendationEvent::query()
            ->selectRaw('property_id, COUNT(*) as hits')
            ->whereNotNull('property_id')
            ->whereIn('event_type', [
                RecommendationEventType::View->value,
                RecommendationEventType::Favorite->value,
            ])
            ->groupBy('property_id')
            ->orderByDesc('hits')
            ->limit($limit)
            ->pluck('property_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
