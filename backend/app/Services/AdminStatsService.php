<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\ReservationStatus;
use App\Enums\UserRole;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AdminStatsService
{
    /**
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        $usersByRole = [];
        foreach (UserRole::cases() as $role) {
            $usersByRole[$role->value] = User::role($role->value)->count();
        }

        $reservationsByStatus = Reservation::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $paymentsByMethod = Payment::query()
            ->where('status', PaymentStatus::Paid->value)
            ->select('method', DB::raw('count(*) as total'), DB::raw('sum(amount) as amount'))
            ->groupBy('method')
            ->get()
            ->mapWithKeys(function ($row) {
                $method = $row->method;
                $methodKey = $method instanceof PaymentMethod
                    ? $method->value
                    : (string) $method;

                return [
                    $methodKey => [
                        'count' => (int) $row->total,
                        'amount' => (string) $row->amount,
                    ],
                ];
            })
            ->all();

        $paidTotal = Payment::query()
            ->where('status', PaymentStatus::Paid)
            ->sum('amount');

        $activeSessions = 0;
        try {
            $activeSessions = app(ActiveSessionService::class)->listActive()->count();
        } catch (InvalidArgumentException) {
            // driver non database
        }

        return [
            'users' => [
                'total' => User::query()->count(),
                'by_role' => $usersByRole,
            ],
            'properties' => [
                'total' => Property::query()->count(),
                'published' => Property::query()->where('status', 'published')->count(),
                'draft' => Property::query()->where('status', 'draft')->count(),
            ],
            'reservations' => [
                'total' => Reservation::query()->count(),
                'by_status' => collect(ReservationStatus::cases())
                    ->mapWithKeys(fn (ReservationStatus $s) => [
                        $s->value => (int) ($reservationsByStatus[$s->value] ?? 0),
                    ])
                    ->all(),
                'paid' => Reservation::query()->whereNotNull('paid_at')->count(),
            ],
            'payments' => [
                'total' => Payment::query()->count(),
                'paid' => Payment::query()->where('status', PaymentStatus::Paid)->count(),
                'paid_amount' => (string) $paidTotal,
                'by_method' => $paymentsByMethod,
            ],
            'active_sessions' => $activeSessions,
        ];
    }
}
