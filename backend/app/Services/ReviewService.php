<?php

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use App\Repositories\ReviewRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public function __construct(
        private readonly ReviewRepository $reviews,
    ) {}

    /**
     * @return LengthAwarePaginator<int, Review>
     */
    public function listForProperty(Property $property, int $perPage = 10): LengthAwarePaginator
    {
        return $this->reviews->paginateForProperty($property, $perPage);
    }

    /**
     * @return array{average: float|null, count: int}
     */
    public function summaryForProperty(int $propertyId): array
    {
        return $this->reviews->summaryForProperty($propertyId);
    }

    public function find(int $id): Review
    {
        return $this->reviews->findById($id);
    }

    /**
     * @param  array{rating: int, comment?: string|null}  $data
     */
    public function create(User $user, Property $property, array $data): Review
    {
        $this->assertCanReview($user, $property);

        if ($this->reviews->findForUserAndProperty($user, $property->id) !== null) {
            throw ValidationException::withMessages([
                'property' => ['Vous avez déjà laissé un avis sur cette annonce.'],
            ]);
        }

        $reservation = $this->eligibleReservation($user, $property);

        return $this->reviews->create([
            'property_id' => $property->id,
            'user_id' => $user->id,
            'reservation_id' => $reservation?->id,
            'rating' => $data['rating'],
            'comment' => isset($data['comment']) ? trim((string) $data['comment']) : null,
        ]);
    }

    /**
     * @param  array{rating?: int, comment?: string|null}  $data
     */
    public function update(User $user, Review $review, array $data): Review
    {
        if ($review->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'authorization' => ['Vous ne pouvez modifier que vos propres avis.'],
            ]);
        }

        $payload = [];

        if (array_key_exists('rating', $data)) {
            $payload['rating'] = $data['rating'];
        }

        if (array_key_exists('comment', $data)) {
            $payload['comment'] = $data['comment'] !== null ? trim((string) $data['comment']) : null;
        }

        return $this->reviews->update($review, $payload);
    }

    public function delete(User $user, Review $review): void
    {
        if ($review->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'authorization' => ['Vous ne pouvez supprimer que vos propres avis.'],
            ]);
        }

        $this->reviews->delete($review);
    }

    public function canUserReview(User $user, Property $property): bool
    {
        if ($user->id === $property->owner_id) {
            return false;
        }

        if ($this->reviews->findForUserAndProperty($user, $property->id) !== null) {
            return false;
        }

        return $this->eligibleReservation($user, $property) !== null;
    }

    private function assertCanReview(User $user, Property $property): void
    {
        if ($user->id === $property->owner_id) {
            throw ValidationException::withMessages([
                'property' => ['Vous ne pouvez pas noter votre propre annonce.'],
            ]);
        }

        if ($this->eligibleReservation($user, $property) === null) {
            throw ValidationException::withMessages([
                'reservation' => ['Un séjour confirmé et terminé est requis pour laisser un avis.'],
            ]);
        }
    }

    private function eligibleReservation(User $user, Property $property): ?Reservation
    {
        return Reservation::query()
            ->where('property_id', $property->id)
            ->where('user_id', $user->id)
            ->where('status', ReservationStatus::Confirmed)
            ->whereDate('end_date', '<=', now()->toDateString())
            ->orderByDesc('end_date')
            ->first();
    }
}
