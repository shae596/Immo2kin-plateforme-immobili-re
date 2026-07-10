<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActiveSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var object{session_id: string, user_id: int, ip_address: ?string, user_agent: ?string, last_activity: int, user: ?\App\Models\User} $session */
        $session = $this->resource;

        return [
            'session_id' => $session->session_id,
            'user_id' => $session->user_id,
            'ip_address' => $session->ip_address,
            'user_agent' => $session->user_agent,
            'last_activity' => date('c', $session->last_activity),
            'user' => $session->user
                ? new UserResource($session->user)
                : null,
        ];
    }
}
