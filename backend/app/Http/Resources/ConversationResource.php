<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Conversation */
class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $other = $viewer ? $this->otherParticipant($viewer) : null;
        $latest = $this->relationLoaded('messages') ? $this->messages->first() : null;

        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'client_id' => $this->client_id,
            'owner_id' => $this->owner_id,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'unread_count' => (int) ($this->unread_count ?? 0),
            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property->id,
                'title' => $this->property->title,
                'city' => $this->property->city,
                'commune' => $this->property->commune,
            ]),
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'email' => $this->client->email,
            ]),
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ]),
            'other_participant' => $other ? [
                'id' => $other->id,
                'name' => $other->name,
                'email' => $other->email,
            ] : null,
            'latest_message' => $latest ? new MessageResource($latest) : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
