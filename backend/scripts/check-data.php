<?php

use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Properties MySQL ===\n";
foreach (Property::query()->orderBy('id')->get(['id', 'title']) as $p) {
    echo "{$p->id} | {$p->title} | images: ".$p->images()->count()."\n";
}

echo "\n=== Files on disk ===\n";
$base = storage_path('app/public/properties');
$dirs = File::isDirectory($base) ? File::directories($base) : [];
foreach ($dirs as $dir) {
    $pid = basename($dir);
    $count = count(File::files($dir.'/images'));
    echo "property {$pid}: {$count} files\n";
}

$sqlite = database_path('database.sqlite');
if (file_exists($sqlite)) {
    config(['database.connections.sqlite_check' => [
        'driver' => 'sqlite',
        'database' => $sqlite,
    ]]);
    $props = DB::connection('sqlite_check')->table('properties')->count();
    $imgs = DB::connection('sqlite_check')->table('property_images')->count();
    echo "\n=== SQLite backup ===\nprops: {$props}, imgs: {$imgs}\n";
}
