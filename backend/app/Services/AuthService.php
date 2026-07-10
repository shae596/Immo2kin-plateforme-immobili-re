<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class AuthService
{
    public function __construct(
        private readonly UserRepository $users,
    ) {}

    /**
     * @param  array{name: string, email: string, password: string, role: string, phone?: string|null}  $data
     */
    public function register(array $data): User
    {
        if ($this->users->findByEmail($data['email']) !== null) {
            throw ValidationException::withMessages([
                'email' => ['Cette adresse e-mail est déjà utilisée.'],
            ]);
        }

        $role = UserRole::from($data['role']);

        if (! in_array($role->value, UserRole::selfAssignable(), true)) {
            throw new InvalidArgumentException('Rôle non autorisé à l\'inscription.');
        }

        $user = $this->users->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
        ]);

        $user->assignRole($role->value);

        event(new Registered($user));

        return $user->load('roles');
    }

    /**
     * @param  array{email: string, password: string, remember?: bool}  $credentials
     */
    public function login(array $credentials): User
    {
        $remember = $credentials['remember'] ?? false;

        if (! Auth::attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password'],
        ], $remember)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        app(ActiveSessionService::class)->bindCurrentSessionToUser($user->id);

        return $user->load('roles');
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();
    }

    public function currentUser(): ?User
    {
        /** @var User|null $user */
        $user = Auth::user();

        return $user?->load('roles');
    }
}
