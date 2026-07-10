<?php

namespace App\Services;

use App\Enums\ListingType;
use App\Enums\ReservationStatus;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use App\Repositories\ReservationRepository;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    private const MAX_ADVANCE_DAYS = 365;

    private const MIN_NIGHTS = 1;

    public function __construct(
        private readonly ReservationRepository $reservations,
    ) {}

    public function listForGuest(User $user, int $perPage = 12): LengthAwarePaginator
    {
        return $this->reservations->paginateForGuest($user, $perPage);
    }

    public function listForOwner(User $owner, int $perPage = 12): LengthAwarePaginator
    {
        if (! $owner->canManageProperties()) {
            throw ValidationException::withMessages([
                'role' => ['Accès réservé aux propriétaires et agences.'],
            ]);
        }

        return $this->reservations->paginateForOwner($owner, $perPage);
    }

    public function find(int $id): Reservation
    {
        return $this->reservations->findById($id);
    }

    /**
     * @return array{
     *     property_id: int,
     *     blocked_ranges: list<array{start_date: string, end_date: string, status: string}>,
     *     min_nights: int,
     *     max_advance_days: int
     * }
     */
    public function availability(Property $property, Carbon $from, Carbon $to): array
    {
        $blocked = $this->reservations
            ->blockingForProperty($property->id, $from, $to)
            ->map(fn (Reservation $r) => [
                'start_date' => $r->start_date->toDateString(),
                'end_date' => $r->end_date->toDateString(),
                'status' => $r->status->value,
            ])
            ->values()
            ->all();

        return [
            'property_id' => $property->id,
            'blocked_ranges' => $blocked,
            'min_nights' => self::MIN_NIGHTS,
            'max_advance_days' => self::MAX_ADVANCE_DAYS,
        ];
    }

    /**
     * @param  array{start_date: string, end_date: string, guests?: int|null, message?: string|null}  $data
     */
    public function create(User $guest, Property $property, array $data): Reservation
    {
        $this->assertCanBook($guest, $property);

        $start = Carbon::parse($data['start_date'])->startOfDay();
        $end = Carbon::parse($data['end_date'])->startOfDay();

        $this->assertValidDates($start, $end);

        if ($this->reservations->hasOverlap($property->id, $start, $end)) {
            throw ValidationException::withMessages([
                'dates' => ['Ces dates ne sont pas disponibles pour ce bien.'],
            ]);
        }

        $nights = max(self::MIN_NIGHTS, $start->diffInDays($end) + 1);
        $totalPrice = $this->estimateTotal($property, $nights);

        $reservation = $this->reservations->create([
            'property_id' => $property->id,
            'user_id' => $guest->id,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'status' => ReservationStatus::Pending,
            'guests' => $data['guests'] ?? null,
            'total_price' => $totalPrice,
            'currency' => $property->currency,
            'message' => $data['message'] ?? null,
        ]);

        return $this->reservations->findById($reservation->id);
    }

    public function confirm(User $actor, Reservation $reservation): Reservation
    {
        $this->assertOwnerAction($actor, $reservation);
        $this->assertStatus($reservation, ReservationStatus::Pending);

        if ($this->reservations->hasOverlap(
            $reservation->property_id,
            $reservation->start_date,
            $reservation->end_date,
            $reservation->id,
        )) {
            throw ValidationException::withMessages([
                'dates' => ['Conflit avec une autre réservation sur ces dates.'],
            ]);
        }

        return $this->reservations->updateStatus($reservation, ReservationStatus::Confirmed);
    }

    public function reject(User $actor, Reservation $reservation): Reservation
    {
        $this->assertOwnerAction($actor, $reservation);
        $this->assertStatus($reservation, ReservationStatus::Pending);

        return $this->reservations->updateStatus($reservation, ReservationStatus::Rejected);
    }

    public function cancel(User $actor, Reservation $reservation): Reservation
    {
        if (! in_array($reservation->status, [ReservationStatus::Pending, ReservationStatus::Confirmed], true)) {
            throw ValidationException::withMessages([
                'status' => ['Cette réservation ne peut plus être annulée.'],
            ]);
        }

        $isGuest = $actor->id === $reservation->user_id;
        $reservation->loadMissing('property');
        $isPropertyOwner = $this->ownsProperty($actor, $reservation);

        if (! $isGuest && ! $isPropertyOwner && ! $actor->hasRole('admin')) {
            throw ValidationException::withMessages([
                'authorization' => ['Vous ne pouvez pas annuler cette réservation.'],
            ]);
        }

        if ($isGuest && $reservation->status === ReservationStatus::Confirmed) {
            if ($reservation->start_date->isPast() || $reservation->start_date->isToday()) {
                throw ValidationException::withMessages([
                    'dates' => ['Impossible d\'annuler une réservation confirmée qui a déjà commencé.'],
                ]);
            }
        }

        return $this->reservations->updateStatus($reservation, ReservationStatus::Cancelled);
    }

    private function assertCanBook(User $guest, Property $property): void
    {
        if (! $property->isPublished()) {
            throw ValidationException::withMessages([
                'property' => ['Cette annonce n\'accepte pas de réservations.'],
            ]);
        }

        if ($property->listing_type !== ListingType::Rent) {
            throw ValidationException::withMessages([
                'property' => ['Seules les annonces à louer acceptent une réservation (les ventes : contactez le propriétaire).'],
            ]);
        }

        if ($guest->id === $property->owner_id) {
            throw ValidationException::withMessages([
                'property' => ['Vous ne pouvez pas réserver votre propre annonce.'],
            ]);
        }
    }

    private function assertValidDates(Carbon $start, Carbon $end): void
    {
        $today = now()->startOfDay();

        if ($start->lt($today)) {
            throw ValidationException::withMessages([
                'start_date' => ['La date d\'arrivée doit être aujourd\'hui ou plus tard.'],
            ]);
        }

        if ($end->lt($start)) {
            throw ValidationException::withMessages([
                'end_date' => ['La date de départ doit être après l\'arrivée.'],
            ]);
        }

        $maxEnd = $today->copy()->addDays(self::MAX_ADVANCE_DAYS);
        if ($start->gt($maxEnd)) {
            throw ValidationException::withMessages([
                'start_date' => ['La réservation est trop éloignée dans le futur.'],
            ]);
        }

        $nights = $start->diffInDays($end) + 1;
        if ($nights < self::MIN_NIGHTS) {
            throw ValidationException::withMessages([
                'end_date' => ['Durée minimale : '.self::MIN_NIGHTS.' nuit.'],
            ]);
        }
    }

    private function assertOwnerAction(User $actor, Reservation $reservation): void
    {
        $reservation->loadMissing('property');

        if (! $this->ownsProperty($actor, $reservation) && ! $actor->hasRole('admin')) {
            throw ValidationException::withMessages([
                'authorization' => ['Seul le propriétaire peut valider ou refuser cette demande.'],
            ]);
        }
    }

    private function ownsProperty(User $actor, Reservation $reservation): bool
    {
        return $actor->id === $reservation->property->owner_id;
    }

    private function assertStatus(Reservation $reservation, ReservationStatus $expected): void
    {
        if ($reservation->status !== $expected) {
            throw ValidationException::withMessages([
                'status' => ['Action impossible pour le statut actuel.'],
            ]);
        }
    }

    private function estimateTotal(Property $property, int $nights): string
    {
        $nightly = (float) $property->price / 30;

        return number_format(round($nightly * $nights, 2), 2, '.', '');
    }
}
