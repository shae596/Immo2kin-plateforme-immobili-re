<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use App\Support\PhoneNormalizer;

class ProfileService
{
    public function __construct(
        private readonly UserRepository $users,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        if (array_key_exists('phone', $data)) {
            $data['phone'] = PhoneNormalizer::normalize(
                is_string($data['phone']) ? $data['phone'] : null,
            );
        }

        return $this->users->update($user, $data);
    }
}
