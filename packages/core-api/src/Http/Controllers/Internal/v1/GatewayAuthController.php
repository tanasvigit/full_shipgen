<?php

namespace Fleetbase\Http\Controllers\Internal\v1;

use Fleetbase\Http\Controllers\Controller;
use Fleetbase\Models\CompanyUser;
use Fleetbase\Support\InternalJwt;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Gateway session introspection (nginx auth_request).
 * Validates browser session / Sanctum token and returns an internal service JWT.
 */
class GatewayAuthController extends Controller
{
    public function authenticate(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response('', 401);
        }

        $companyUuid = session('company') ?? $user->company_uuid;

        $requestedCompany = $request->header('X-Company');
        if (is_string($requestedCompany) && Str::isUuid($requestedCompany)) {
            $belongsToCompany = CompanyUser::where([
                'user_uuid'    => $user->uuid,
                'company_uuid' => $requestedCompany,
            ])->exists();

            if ($belongsToCompany) {
                $companyUuid = $requestedCompany;
            }
        }

        $token = InternalJwt::mint(
            $user->uuid,
            $companyUuid,
            [
                'is_admin' => (bool) session('is_admin', $user->isAdmin()),
            ]
        );

        return response('', 200)
            ->header('X-Service-Authorization', $token)
            ->header('X-User-Uuid', $user->uuid)
            ->header('X-Company-Uuid', (string) $companyUuid);
    }
}
