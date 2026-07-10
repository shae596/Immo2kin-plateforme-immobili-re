<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ConversationRepository
{
    public function findById(int $id): Conversation
    {
        $conversation = Conversation::query()
            ->with([
                'property:id,title,city,commune,owner_id',
                'client:id,name,email',
                'owner:id,name,email',
            ])
            ->find($id);

        if ($conversation === null) {
            throw new ModelNotFoundException('Conversation introuvable.');
        }

        return $conversation;
    }

    public function findForPropertyAndClient(int $propertyId, int $clientId): ?Conversation
    {
        return Conversation::query()
            ->where('property_id', $propertyId)
            ->where('client_id', $clientId)
            ->first();
    }

    /**
     * @return LengthAwarePaginator<int, Conversation>
     */
    public function paginateForUser(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return Conversation::query()
            ->with([
                'property:id,title,city,commune',
                'client:id,name,email',
                'owner:id,name,email',
                'messages' => fn ($q) => $q->latest()->limit(1)->with('user:id,name'),
            ])
            ->withCount([
                'messages as unread_count' => fn ($q) => $q
                    ->where('user_id', '!=', $user->id)
                    ->whereNull('read_at'),
            ])
            ->where(fn ($q) => $q->where('client_id', $user->id)->orWhere('owner_id', $user->id))
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * @return LengthAwarePaginator<int, Message>
     */
    public function paginateMessages(Conversation $conversation, int $perPage = 30): LengthAwarePaginator
    {
        return Message::query()
            ->with('user:id,name')
            ->where('conversation_id', $conversation->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Conversation
    {
        return Conversation::query()->create($attributes);
    }

    public function createMessage(Conversation $conversation, int $userId, string $body): Message
    {
        $message = Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $userId,
            'body' => $body,
        ]);

        $conversation->last_message_at = $message->created_at;
        $conversation->save();

        return $message->load('user:id,name,email');
    }

    public function markAsRead(Conversation $conversation, User $reader): int
    {
        return Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', '!=', $reader->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function unreadTotalForUser(User $user): int
    {
        return Message::query()
            ->whereHas('conversation', fn ($q) => $q
                ->where('client_id', $user->id)
                ->orWhere('owner_id', $user->id))
            ->where('user_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();
    }
}
