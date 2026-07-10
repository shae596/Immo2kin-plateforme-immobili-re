<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminUserService
{
    public function __construct(
        private readonly UserRepository $users,
    ) {}

    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginate(?string $search = null, ?string $role = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()->with('roles')->orderByDesc('created_at');

        if (is_string($search) && $search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (is_string($role) && $role !== '') {
            $query->role($role);
        }

        return $query->paginate($perPage);
    }

    /**
     * @param  array{name: string, email: string, password: string, role: string, phone?: string|null, email_verified?: bool}  $data
     */
    public function create(array $data): User
    {
        if ($this->users->findByEmail($data['email']) !== null) {
            throw ValidationException::withMessages([
                'email' => ['Cette adresse e-mail est déjà utilisée.'],
            ]);
        }

        $role = UserRole::from($data['role']);

        $user = $this->users->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'email_verified_at' => ($data['email_verified'] ?? false) ? now() : null,
        ]);

        $user->syncRoles([$role->value]);

        return $user->load('roles');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data, User $actor): User
    {
        if (isset($data['email']) && $data['email'] !== $user->email) {
            if ($this->users->findByEmail($data['email']) !== null) {
                throw ValidationException::withMessages([
                    'email' => ['Cette adresse e-mail est déjà utilisée.'],
                ]);
            }
        }

        $attributes = collect($data)->only([
            'name', 'email', 'phone', 'bio', 'city', 'commune',
        ])->filter(fn ($v) => $v !== null)->all();

        if (! empty($data['password'])) {
            $attributes['password'] = Hash::make($data['password']);
        }

        if (array_key_exists('email_verified', $data)) {
            $attributes['email_verified_at'] = $data['email_verified'] ? now() : null;
        }

        $user = $this->users->update($user, $attributes);

        if (isset($data['role'])) {
            $role = UserRole::from($data['role']);
            $user->syncRoles([$role->value]);
        }

        return $user->fresh(['roles']);
    }

    public function delete(User $user, User $actor): void
    {
        if ($user->id === $actor->id) {
            throw ValidationException::withMessages([
                'user' => ['Vous ne pouvez pas supprimer votre propre compte.'],
            ]);
        }

        $user->delete();
    }
}
