<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Device;
use Fleetbase\FleetOps\Models\Telematic;
use Fleetbase\FleetOps\Support\Telematics\TelematicProviderRegistry;
use Fleetbase\FleetOps\Support\Telematics\TelematicService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelematicController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'telematic';

    protected TelematicService $telematicService;
    protected TelematicProviderRegistry $registry;

    public function __construct(TelematicService $service, TelematicProviderRegistry $registry)
    {
        parent::__construct();
        $this->telematicService  = $service;
        $this->registry          = $registry;
    }

    /**
     * Query callback when querying record.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @param Request                            $request
     */
    public static function onQueryRecord($query, $request): void
    {
        $query->with(['warranty']);
    }

    /**
     * List available providers.
     */
    public function providers(): JsonResponse
    {
        $providers = $this->registry->all()->map(fn ($p) => $p->toArray());

        return response()->json($providers->values());
    }

    /**
     * Resolve telematic id from route param or request body (legacy flat routes).
     */
    protected function resolveTelematicId(Request $request, ?string $id = null): string
    {
        $resolved = $id ?: $request->input('telematic') ?: $request->input('telematic_uuid') ?: $request->input('id');

        if (!$resolved) {
            abort(400, 'Telematic id is required.');
        }

        return $resolved;
    }

    /**
     * Test connection to provider.
     */
    public function testConnection(Request $request, string $id): JsonResponse
    {
        $telematic = Telematic::where('uuid', $this->resolveTelematicId($request, $id))
            ->where('company_uuid', session('company'))
            ->firstOrFail();

        $async = $request->input('async', false);

        $result = $this->telematicService->testConnection($telematic, $async);

        if ($async) {
            return response()->json($result, 202);
        }

        return response()->json($result);
    }

    /**
     * Test connection to provider.
     */
    public function testCredentials(Request $request, string $key): JsonResponse
    {
        $credentials = $request->array('credentials', []);
        $async       = $request->input('async', false);

        try {
            $provider = $this->registry->resolve($key);
            if (!$provider) {
                return response()->error('Unable to resolve telematic provider.');
            }
            $result   = $provider->testConnection($credentials);
        } catch (\Exception $e) {
            return response()->error($e->getMessage());
        }

        if ($async) {
            return response()->json($result, 202);
        }

        return response()->json($result);
    }

    /**
     * Discover devices from provider.
     */
    public function discover(Request $request, ?string $id = null): JsonResponse
    {
        $telematic = Telematic::where('uuid', $this->resolveTelematicId($request, $id))
            ->where('company_uuid', session('company'))
            ->firstOrFail();

        $jobId = $this->telematicService->discoverDevices($telematic, [
            'limit'   => $request->input('limit', 100),
            'filters' => $request->input('filters', []),
        ]);

        return response()->json([
            'job_id'  => $jobId,
            'message' => 'Device discovery initiated',
        ], 202);
    }

    /**
     * Get devices for a telematic.
     */
    public function devices(Request $request, ?string $id = null): JsonResponse
    {
        $telematic = Telematic::where('uuid', $this->resolveTelematicId($request, $id))
            ->where('company_uuid', session('company'))
            ->firstOrFail();

        $devices = $this->telematicService->getDevices($telematic, [
            'status' => $request->input('status'),
            'search' => $request->input('search'),
        ]);

        return response()->json([
            'data' => $devices->map(fn (Device $device) => [
                'uuid'          => $device->uuid,
                'public_id'     => $device->public_id,
                'name'          => $device->name,
                'imei'          => $device->imei,
                'serial_number' => $device->serial_number,
                'provider'      => $device->provider,
                'status'        => $device->status,
                'telematic_uuid'=> $device->telematic_uuid,
                'device_id'     => $device->device_id,
            ])->values(),
        ]);
    }

    /**
     * Link a device to a telematic.
     */
    public function linkDevice(Request $request, ?string $id = null): JsonResponse
    {
        $telematic = Telematic::where('uuid', $this->resolveTelematicId($request, $id))
            ->where('company_uuid', session('company'))
            ->firstOrFail();

        $request->validate([
            'external_id' => 'required|string',
            'device_name' => 'required|string',
        ]);

        $device = $this->telematicService->linkDevice($telematic, $request->all());

        return response()->json([
            'device' => $device,
        ], 201);
    }
}
