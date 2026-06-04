<?php

namespace Fleetbase\Http\Middleware;

class VerifyGatewaySecret
{
    /**
     * Restrict gateway introspection to the API gateway (shared secret).
     */
    public function handle($request, \Closure $next)
    {
        $secret = config('fleetbase.gateway.internal_secret');

        if (!$secret || $request->header('X-Gateway-Internal-Secret') !== $secret) {
            return response('', 403);
        }

        return $next($request);
    }
}
