<?php

use App\Http\Controllers\Api\V1\AdminActiveSessionController;
use App\Http\Controllers\Api\V1\AdminPaymentController;
use App\Http\Controllers\Api\V1\AdminPropertyController;
use App\Http\Controllers\Api\V1\AdminReservationController;
use App\Http\Controllers\Api\V1\AdminStatsController;
use App\Http\Controllers\Api\V1\AdminUserController;
use App\Http\Controllers\Api\V1\AdminVerificationController;
use App\Http\Controllers\Api\V1\AmenityController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\PropertyAvailabilityController;
use App\Http\Controllers\Api\V1\PropertyController;
use App\Http\Controllers\Api\V1\PropertyMediaController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\RecommendationController;
use App\Http\Controllers\Api\V1\ReservationController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\StripeWebhookController;
use App\Http\Controllers\Api\V1\VerificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class);

    Route::post('/webhooks/stripe', StripeWebhookController::class);

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
            ->middleware('throttle:6,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/profile', [ProfileController::class, 'update']);
            Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
                ->middleware(['signed', 'throttle:6,1'])
                ->name('verification.verify');
            Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])
                ->middleware('throttle:6,1');
        });
    });

    Route::get('/amenities', [AmenityController::class, 'index']);

    Route::middleware('throttle:search')->group(function (): void {
        Route::get('/properties', [PropertyController::class, 'index']);
        Route::get('/properties/map', [PropertyController::class, 'map']);
    });

    Route::get('/properties/{property}/availability', [PropertyAvailabilityController::class, 'show']);
    Route::get('/properties/{property}/reviews', [ReviewController::class, 'index']);
    Route::get('/properties/{property}/similar', [RecommendationController::class, 'similar']);
    Route::get('/recommendations', [RecommendationController::class, 'index']);
    Route::get('/properties/{property}', [PropertyController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/my/properties', [PropertyController::class, 'myProperties']);
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{property}', [PropertyController::class, 'update']);
        Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);

        Route::post('/properties/{property}/images', [PropertyMediaController::class, 'storeImage'])
            ->middleware('throttle:uploads');
        Route::delete('/properties/{property}/images/{image}', [PropertyMediaController::class, 'destroyImage']);
        Route::post('/properties/{property}/videos', [PropertyMediaController::class, 'storeVideo'])
            ->middleware('throttle:uploads');
        Route::delete('/properties/{property}/videos/{video}', [PropertyMediaController::class, 'destroyVideo']);

        Route::get('/favorites', [FavoriteController::class, 'index']);
        Route::post('/favorites/{property}', [FavoriteController::class, 'store']);
        Route::delete('/favorites/{property}', [FavoriteController::class, 'destroy']);

        Route::get('/reservations', [ReservationController::class, 'index']);
        Route::get('/my/properties/reservations', [ReservationController::class, 'indexForOwner']);
        Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
        Route::post('/properties/{property}/reservations', [ReservationController::class, 'store'])
            ->middleware('throttle:6,1');
        Route::post('/reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
        Route::post('/reservations/{reservation}/reject', [ReservationController::class, 'reject']);
        Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

        Route::get('/payments/{payment}', [PaymentController::class, 'show']);
        Route::post('/reservations/{reservation}/payments/stripe', [PaymentController::class, 'initiateStripe']);
        Route::post('/payments/{payment}/stripe/confirm', [PaymentController::class, 'confirmStripe']);
        Route::post('/reservations/{reservation}/payments/mobile-money', [PaymentController::class, 'initiateMobileMoney']);
        Route::post('/payments/{payment}/mobile-money/confirm', [PaymentController::class, 'confirmMobileMoney']);

        Route::get('/conversations', [ConversationController::class, 'index']);
        Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
        Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
        Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage'])
            ->middleware('throttle:6,1');
        Route::post('/conversations/{conversation}/read', [ConversationController::class, 'markRead']);
        Route::post('/properties/{property}/conversations', [ConversationController::class, 'store'])
            ->middleware('throttle:6,1');

        Route::post('/properties/{property}/reviews', [ReviewController::class, 'store'])
            ->middleware('throttle:6,1');
        Route::put('/reviews/{review}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

        Route::get('/verifications', [VerificationController::class, 'index']);
        Route::post('/verifications', [VerificationController::class, 'store'])
            ->middleware('throttle:6,1');
        Route::get('/verifications/{verification}', [VerificationController::class, 'show']);

        Route::post('/recommendation-events', [RecommendationController::class, 'storeEvent'])
            ->middleware('throttle:30,1');

        Route::middleware('admin')->prefix('admin')->group(function (): void {
            Route::get('/stats', AdminStatsController::class);
            Route::get('/active-sessions', [AdminActiveSessionController::class, 'index']);
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::post('/users', [AdminUserController::class, 'store']);
            Route::get('/users/{user}', [AdminUserController::class, 'show']);
            Route::put('/users/{user}', [AdminUserController::class, 'update']);
            Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
            Route::get('/properties', [AdminPropertyController::class, 'index']);
            Route::get('/reservations', [AdminReservationController::class, 'index']);
            Route::get('/payments', [AdminPaymentController::class, 'index']);
            Route::get('/verifications', [AdminVerificationController::class, 'index']);
            Route::post('/verifications/{verification}/approve', [AdminVerificationController::class, 'approve']);
            Route::post('/verifications/{verification}/reject', [AdminVerificationController::class, 'reject']);
        });
    });
});
