<?php

namespace App\Support;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

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
}
