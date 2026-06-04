<?php

namespace Fleetbase\Http\Middleware;

use Fleetbase\Models\User;
use Fleetbase\Support\Auth;
use Fleetbase\Support\InternalJwt;
use Illuminate\Support\Facades\Auth as LaravelAuth;

/**
 * When the gateway forwards X-Service-Authorization, establish session context
 * without requiring a browser cookie (for extracted domain services).
 */
class TrustInternalServiceJwt
{
    public function handle($request, \Closure $next)
    {
        if (!config('fleetbase.gateway.trust_internal_jwt', false)) {
            return $next($request);
        }

        $raw = $request->header('X-Service-Authorization', '');

        if ($raw === '' || $request->user()) {
            return $next($request);
        }

        $jwt = str_starts_with($raw, 'Bearer ') ? substr($raw, 7) : $raw;

        try {
            $validated = InternalJwt::validate($jwt);
        } catch (\Throwable) {
            return response()->json(['error' => 'Invalid service token.'], 401);
        }

        $user = User::where('uuid', $validated['sub'])->first();

        if (!$user) {
            return response()->json(['error' => 'Invalid service token subject.'], 401);
        }

        if ($validated['company_uuid']) {
            $user->setAttribute('company_uuid', $validated['company_uuid']);
        }

        LaravelAuth::setUser($user);
        Auth::setSession($user);

        $request->attributes->set('internal_jwt', $validated);

        return $next($request);
    }
}
