<?php

namespace Fleetbase\Http\Middleware;

use Fleetbase\Models\User;
use Fleetbase\Support\Auth;
use Illuminate\Support\Facades\Auth as LaravelAuth;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Resolve user for gateway introspection without aborting with JSON errors.
 * Returns empty 401 for nginx auth_request when not authenticated.
 */
class AuthenticateGatewaySession
{
    public function handle($request, \Closure $next)
    {
        $user = null;

        if ($token = $request->bearerToken()) {
            $accessToken = PersonalAccessToken::findToken($token);
            if ($accessToken?->tokenable instanceof User) {
                $user = $accessToken->tokenable;
            }
        }

        if (!$user && $request->hasSession()) {
            $userUuid = session('user');
            if ($userUuid) {
                $user = User::where('uuid', $userUuid)->first();
            }
        }

        if (!$user) {
            return response('', 401);
        }

        LaravelAuth::setUser($user);
        Auth::setSession($user);

        return $next($request);
    }
}
