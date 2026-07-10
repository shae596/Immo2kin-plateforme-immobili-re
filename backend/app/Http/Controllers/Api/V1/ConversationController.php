<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Conversation\StoreConversationRequest;
use App\Http\Requests\Conversation\StoreMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Property;
use App\Services\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversations,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $paginator = $this->conversations->listForUser($user, (int) $request->input('per_page', 20));

        return response()->json([
            'data' => ConversationResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'unread_total' => $this->conversations->unreadTotal($user),
            ],
        ]);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        return response()->json([
            'conversation' => new ConversationResource($this->conversations->find($conversation->id)),
        ]);
    }

    public function store(StoreConversationRequest $request, Property $property): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $result = $this->conversations->startOrReply($user, $property, $request->validated('body'));

        return response()->json([
            'message' => 'Message envoyé.',
            'conversation' => new ConversationResource($result['conversation']),
            'chat_message' => new MessageResource($result['message']),
        ], 201);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $paginator = $this->conversations->messages(
            $request->user(),
            $conversation,
            (int) $request->input('per_page', 30),
        );

        $items = array_reverse($paginator->items());

        return response()->json([
            'data' => MessageResource::collection($items),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function sendMessage(StoreMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('message', $conversation);

        $message = $this->conversations->sendMessage(
            $request->user(),
            $conversation,
            $request->validated('body'),
        );

        return response()->json([
            'message' => 'Message envoyé.',
            'chat_message' => new MessageResource($message),
        ], 201);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $count = $this->conversations->markRead($request->user(), $conversation);

        return response()->json([
            'message' => 'Messages marqués comme lus.',
            'marked' => $count,
        ]);
    }
}
