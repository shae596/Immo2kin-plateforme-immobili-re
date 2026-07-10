<?php

use App\Models\Favorite;
use App\Models\Property;
use App\Models\RecommendationEvent;
use App\Models\Review;
use App\Models\User;
use App\Models\Verification;
use App\Enums\RecommendationEventType;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = User::query()->where('email', 'client@immo.local')->first();

echo "=== RECOMMANDATIONS ===\n";
echo 'Events total: '.RecommendationEvent::count()."\n";
echo 'Events client: '.($client ? RecommendationEvent::where('user_id', $client->id)->count() : 0)."\n";

if ($client) {
    foreach (RecommendationEvent::where('user_id', $client->id)->orderBy('id')->get() as $e) {
        $p = Property::find($e->property_id);
        $ok = $p ? 'OK' : 'ORPHELIN';
        echo "  [{$e->event_type->value}] #{$e->property_id} {$ok} ".($p?->title ?? '')."\n";
    }
}

echo "\n=== FAVORIS ===\n";
echo 'Total: '.Favorite::count()."\n";

echo "\n=== AVIS ===\n";
echo 'Total: '.Review::count()."\n";
foreach (Review::with('property:id,title')->get() as $r) {
    echo "  {$r->rating}/5 - ".($r->property?->title ?? '#'.$r->property_id)."\n";
}

echo "\n=== VERIFICATIONS ===\n";
echo 'Total: '.Verification::count()."\n";
foreach (Verification::with(['user:id,name', 'property:id,title'])->get() as $v) {
    $target = $v->property?->title ?? $v->user?->name ?? '?';
    echo "  [{$v->status->value}] {$v->type->value} - {$target}\n";
}

echo "\n=== API guest recommendations (ids) ===\n";
$json = @file_get_contents('http://127.0.0.1:8000/api/v1/recommendations');
if ($json) {
    $data = json_decode($json, true);
    foreach (array_slice($data['data'] ?? [], 0, 5) as $item) {
        $imgs = count($item['images'] ?? []);
        echo "  #{$item['id']} {$item['title']} ({$imgs} photos)\n";
    }
    echo '  personalized: '.json_encode($data['meta']['personalized'] ?? null)."\n";
}

// Restore favorites from favorite events if missing
if ($client && Favorite::count() === 0) {
    $favEvents = RecommendationEvent::where('user_id', $client->id)
        ->where('event_type', RecommendationEventType::Favorite)
        ->whereNotNull('property_id')
        ->get();
    $restored = 0;
    foreach ($favEvents as $e) {
        if (Property::find($e->property_id)) {
            Favorite::firstOrCreate([
                'user_id' => $client->id,
                'property_id' => $e->property_id,
            ]);
            $restored++;
        }
    }
    if ($restored > 0) {
        echo "\nFavoris restaures depuis events: {$restored}\n";
    }
}
