<?php

namespace App\Support;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use Throwable;

final class MediaStorage
{
    public static function diskName(): string
    {
        $disk = (string) config('filesystems.media_disk', 'public');

        return $disk !== '' ? $disk : 'public';
    }

    public static function disk(): Filesystem
    {
        return Storage::disk(self::diskName());
    }

    /**
     * R2/S3 : exists() peut lever une exception (NoSuchKey) au lieu de retourner false.
     */
    public static function safeExists(Filesystem $disk, string $path): bool
    {
        try {
            return $disk->exists($path);
        } catch (Throwable) {
            return false;
        }
    }
}
