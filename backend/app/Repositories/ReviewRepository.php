<?php

namespace App\Repositories;

use App\Models\Property;
use App\Models\Review;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ReviewRepository
{
    public function findById(int $id): Review
    {
        $review = Review::query()
            ->with(['user:id,name', 'property:id,title'])
            ->find($id);

        if ($review === null) {
            throw new ModelNotFoundException('Avis introuvable.');
        }

        return $review;
    }

    /**
     * @return LengthAwarePaginator<int, Review>
     */
    public function paginateForProperty(Property $property, int $perPage = 10): LengthAwarePaginator
    {
        return Review::query()
            ->where('property_id', $property->id)
            ->with(['user:id,name'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function findForUserAndProperty(User $user, int $propertyId): ?Review
    {
        return Review::query()
            ->where('property_id', $propertyId)
            ->where('user_id', $user->id)
            ->first();
    }

    /**
     * @return array{average: float|null, count: int}
     */
    public function summaryForProperty(int $propertyId): array
    {
        $count = Review::query()->where('property_id', $propertyId)->count();

        if ($count === 0) {
            return ['average' => null, 'count' => 0];
        }

        $average = (float) Review::query()
            ->where('property_id', $propertyId)
            ->avg('rating');

        return [
            'average' => round($average, 1),
            'count' => $count,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Review
    {
        return Review::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Review $review, array $data): Review
    {
        $review->update($data);

        return $this->findById($review->id);
    }

    public function delete(Review $review): void
    {
        $review->delete();
    }
}
