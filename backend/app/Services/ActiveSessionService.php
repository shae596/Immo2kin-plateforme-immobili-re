<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ActiveSessionService
{
    /**
     * Sessions actives (utilisateur connecté, activité dans la durée de vie de session).
     *
     * @return Collection<int, object{
     *     session_id: string,
     *     user_id: int,
     *     ip_address: string|null,
     *     user_agent: string|null,
     *     last_activity: int,
     *     user: User|null
     * }>
     */
    public function listActive(): Collection
    {
        if (config('session.driver') !== 'database') {
            throw new InvalidArgumentException(
                'Les sessions doivent utiliser le driver "database" (SESSION_DRIVER=database) pour lister les utilisateurs connectés.',
            );
        }

        $cutoff = now()->subMinutes((int) config('session.lifetime', 120))->timestamp;

        $sessions = DB::table('sessions')
            ->where('last_activity', '>=', $cutoff)
            ->orderByDesc('last_activity')
            ->get();

        $resolved = $sessions->map(function ($session) {
            $userId = $session->user_id !== null
                ? (int) $session->user_id
                : $this->extractUserIdFromPayload((string) $session->payload);

            if ($userId === null) {
                return null;
            }

            return (object) [
                'session_id' => $session->id,
                'user_id' => $userId,
                'ip_address' => $session->ip_address,
                'user_agent' => $session->user_agent,
                'last_activity' => (int) $session->last_activity,
                'user' => null,
            ];
        })->filter();

        $users = User::query()
            ->with('roles')
            ->whereIn('id', $resolved->pluck('user_id')->unique())
            ->get()
            ->keyBy('id');

        return $resolved->map(function ($session) use ($users) {
            $session->user = $users->get($session->user_id);

            return $session;
        })->values();
    }

    public function bindCurrentSessionToUser(int $userId): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        $sessionId = session()->getId();
        if ($sessionId === '') {
            return;
        }

        DB::table('sessions')
            ->where('id', $sessionId)
            ->update(['user_id' => $userId]);
    }

    private function extractUserIdFromPayload(string $payload): ?int
    {
        if ($payload === '') {
            return null;
        }

        if (config('session.encrypt')) {
            try {
                $payload = decrypt($payload);
            } catch (\Throwable) {
                return null;
            }
        }

        $data = @unserialize(base64_decode($payload));
        if (! is_array($data)) {
            return null;
        }

        foreach ($data as $key => $value) {
            if (is_string($key) && str_starts_with($key, 'login_web_') && is_numeric($value)) {
                return (int) $value;
            }
        }

        return null;
    }
}
