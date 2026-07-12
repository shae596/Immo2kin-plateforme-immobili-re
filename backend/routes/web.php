<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $index = public_path('index.html');

    if (File::exists($index)) {
        return response()->file($index);
    }

    return view('welcome');
});

Route::get('/{path}', function () {
    $index = public_path('index.html');

    if (! File::exists($index)) {
        abort(404);
    }

    return response()->file($index);
})->where('path', '^(?!api|sanctum|broadcasting|storage|up|build).*$');
