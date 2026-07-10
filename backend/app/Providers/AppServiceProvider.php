<?php

namespace App\Providers;

use App\Services\Payments\FakeStripePaymentGateway;
use App\Services\Payments\StripePaymentGateway;
use App\Services\Payments\StripePaymentGatewayInterface;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(StripePaymentGatewayInterface::class, function () {
            $secret = config('services.stripe.secret');

            if (app()->environment('testing') || ! is_string($secret) || $secret === '') {
                return new FakeStripePaymentGateway;
            }

            return new StripePaymentGateway;
        });
    }

    public function boot(): void
    {
        Broadcast::routes(['middleware' => ['web', 'auth:sanctum']]);

        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input('email');

            return Limit::perMinute(5)->by($email.$request->ip());
        });

        RateLimiter::for('uploads', function (Request $request) {
            return Limit::perMinute(20)->by((string) $request->user()?->id.$request->ip());
        });

        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            $frontend = rtrim((string) config('app.frontend_url'), '/');
            $signedUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ],
            );

            if (preg_match('#/email/verify/(\d+)/([^/?]+)(\?.*)?$#', $signedUrl, $matches) !== 1) {
                return $signedUrl;
            }

            $query = $matches[3] ?? '';
            if ($query !== '' && ! str_starts_with($query, '?')) {
                $query = '?'.$query;
            }

            return "{$frontend}/verify-email/{$matches[1]}/{$matches[2]}{$query}";
        });

        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $frontend = rtrim((string) config('app.frontend_url'), '/');
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return "{$frontend}/reset-password?token={$token}&email={$email}";
        });
    }
}
