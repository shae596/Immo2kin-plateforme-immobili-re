<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->hasRole(UserRole::Admin->value)) {
            return response()->json([
                'message' => 'Accès réservé aux administrateurs.',
                'code' => 'forbidden',
            ], 403);
        }

        return $next($request);
    }
}
