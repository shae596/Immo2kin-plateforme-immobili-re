<?php

namespace App\Repositories;

use App\Enums\ReservationStatus;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ReservationRepository
{
    /**
     * @return Collection<int, Reservation>
     */
    public function blockingForProperty(int $propertyId, ?Carbon $from = null, ?Carbon $to = null): Collection
    {
        $query = Reservation::query()
            ->where('property_id', $propertyId)
            ->whereIn('status', [
                ReservationStatus::Pending,
                ReservationStatus::Confirmed,
            ]);

        if ($from !== null && $to !== null) {
            $query->where('start_date', '<=', $to->toDateString())
                ->where('end_date', '>=', $from->toDateString());
        }

        return $query->orderBy('start_date')->get();
    }

    public function hasOverlap(int $propertyId, Carbon $start, Carbon $end, ?int $exceptId = null): bool
    {
        $query = Reservation::query()
            ->where('property_id', $propertyId)
            ->whereIn('status', [
                ReservationStatus::Pending,
                ReservationStatus::Confirmed,
            ])
            ->where('start_date', '<=', $end->toDateString())
            ->where('end_date', '>=', $start->toDateString());

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->exists();
    }

    public function findById(int $id): Reservation
    {
        $reservation = Reservation::query()
            ->with(['property.owner:id,name,email,phone', 'user:id,name,email,phone'])
            ->find($id);

        if ($reservation === null) {
            throw new ModelNotFoundException('Réservation introuvable.');
        }

        return $reservation;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Reservation
    {
        return Reservation::query()->create($attributes);
    }

    public function updateStatus(Reservation $reservation, ReservationStatus $status): Reservation
    {
        $reservation->status = $status;
        $reservation->save();

        return $this->findById($reservation->id);
    }

    public function paginateForGuest(User $user, int $perPage = 12): LengthAwarePaginator
    {
        return $this->guestQuery($user)->paginate($perPage);
    }

    public function paginateForOwner(User $owner, int $perPage = 12): LengthAwarePaginator
    {
        return $this->ownerQuery($owner)->paginate($perPage);
    }

    /**
     * @return Builder<Reservation>
     */
    private function guestQuery(User $user): Builder
    {
        return Reservation::query()
            ->with(['property:id,title,city,commune,price,currency,listing_type,owner_id', 'property.owner:id,name'])
            ->where('user_id', $user->id)
            ->latest();
    }

    /**
     * @return Builder<Reservation>
     */
    private function ownerQuery(User $owner): Builder
    {
        return Reservation::query()
            ->with(['property:id,title,city,commune,price,currency,listing_type,owner_id', 'user:id,name,email,phone'])
            ->whereHas('property', fn (Builder $q) => $q->where('owner_id', $owner->id))
            ->latest();
    }
}
