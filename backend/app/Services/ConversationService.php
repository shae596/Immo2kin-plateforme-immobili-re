<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Property;
use App\Models\User;
use App\Repositories\ConversationRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ConversationService
{
    public function __construct(
        private readonly ConversationRepository $conversations,
    ) {}

    /**
     * @return LengthAwarePaginator<int, Conversation>
     */
    public function listForUser(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $this->conversations->paginateForUser($user, $perPage);
    }

    public function find(int $id): Conversation
    {
        return $this->conversations->findById($id);
    }

    public function unreadTotal(User $user): int
    {
        return $this->conversations->unreadTotalForUser($user);
    }

    /**
     * @return array{conversation: Conversation, message: Message}
     */
    public function startOrReply(User $user, Property $property, string $body): array
    {
        $body = trim($body);
        if ($body === '') {
            throw ValidationException::withMessages([
                'body' => ['Le message ne peut pas être vide.'],
            ]);
        }

        if ($property->status !== PropertyStatus::Published) {
            throw ValidationException::withMessages([
                'property' => ['Impossible de contacter le propriétaire pour une annonce non publiée.'],
            ]);
        }

        return DB::transaction(function () use ($user, $property, $body) {
            $existing = $this->conversations->findForPropertyAndClient($property->id, $user->id);

            if ($existing !== null) {
                if (! $existing->involvesUser($user)) {
                    throw ValidationException::withMessages([
                        'authorization' => ['Accès refusé à cette conversation.'],
                    ]);
                }

                $message = $this->conversations->createMessage($existing, $user->id, $body);
                $this->broadcastMessage($message);

                return [
                    'conversation' => $this->conversations->findById($existing->id),
                    'message' => $message,
                ];
            }

            if ($user->id === $property->owner_id) {
                throw ValidationException::withMessages([
                    'property' => ['Vous ne pouvez pas démarrer une conversation sur votre propre annonce.'],
                ]);
            }

            $conversation = $this->conversations->create([
                'property_id' => $property->id,
                'client_id' => $user->id,
                'owner_id' => $property->owner_id,
            ]);

            $message = $this->conversations->createMessage($conversation, $user->id, $body);
            $this->broadcastMessage($message);

            return [
                'conversation' => $this->conversations->findById($conversation->id),
                'message' => $message,
            ];
        });
    }

    public function sendMessage(User $user, Conversation $conversation, string $body): Message
    {
        if (! $conversation->involvesUser($user)) {
            throw ValidationException::withMessages([
                'authorization' => ['Accès refusé à cette conversation.'],
            ]);
        }

        $body = trim($body);
        if ($body === '') {
            throw ValidationException::withMessages([
                'body' => ['Le message ne peut pas être vide.'],
            ]);
        }

        $message = $this->conversations->createMessage($conversation, $user->id, $body);
        $this->broadcastMessage($message);

        return $message;
    }

    private function broadcastMessage(Message $message): void
    {
        if (config('broadcasting.default') === 'null') {
            return;
        }

        try {
            MessageSent::dispatch($message);
        } catch (\Throwable $e) {
            Log::warning('Broadcast messagerie indisponible (Reverb arrêté ?)', [
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return LengthAwarePaginator<int, Message>
     */
    public function messages(User $user, Conversation $conversation, int $perPage = 30): LengthAwarePaginator
    {
        if (! $conversation->involvesUser($user)) {
            throw ValidationException::withMessages([
                'authorization' => ['Accès refusé à cette conversation.'],
            ]);
        }

        $this->conversations->markAsRead($conversation, $user);

        return $this->conversations->paginateMessages($conversation, $perPage);
    }

    public function markRead(User $user, Conversation $conversation): int
    {
        if (! $conversation->involvesUser($user)) {
            throw ValidationException::withMessages([
                'authorization' => ['Accès refusé à cette conversation.'],
            ]);
        }

        return $this->conversations->markAsRead($conversation, $user);
    }
}
