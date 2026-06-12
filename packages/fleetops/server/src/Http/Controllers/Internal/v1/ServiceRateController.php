<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Brick\Geo\Point;
use Fleetbase\FleetOps\Exports\ServiceRateExport;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Models\Route;
use Fleetbase\FleetOps\Models\ServiceRate;
use Fleetbase\FleetOps\Support\Utils;
use Fleetbase\Http\Requests\ExportRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class ServiceRateController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'service_rate';

    /**
     * Creates a record with request payload.
     *
     * @return \Illuminate\Http\Response
     */
    public function getServicesForRoute(Request $request)
    {
        $coordinatesString = $request->input('coordinates');

        if (empty($coordinatesString) && ($request->filled('route') || $request->filled('route_id'))) {
            $routeId             = $request->input('route') ?: $request->input('route_id');
            $coordinatesString   = $this->resolveCoordinatesFromRoute($routeId, $request);
        }

        if (empty($coordinatesString)) {
            return response()->json([]);
        }

        // ex. 1.3621663,103.8845049;1.353151,103.86458
        $coordinates = explode(';', $coordinatesString);

        $waypoints = collect($coordinates)
            ->map(fn ($coord) => trim((string) $coord))
            ->filter()
            ->map(function ($coord) {
                $parts = array_map('trim', explode(',', $coord));
                if (count($parts) < 2) {
                    return null;
                }

                [$latitude, $longitude] = $parts;

                return Point::fromText("POINT($longitude $latitude)", 4326);
            })
            ->filter();

        if ($waypoints->isEmpty()) {
            return response()->json([]);
        }

        $applicableServiceRates = ServiceRate::getServicableForWaypoints(
            $waypoints,
            function ($query) use ($request) {
                $query->where('company_uuid', $request->session()->get('company'));
                if ($request->filled('service_type')) {
                    $query->where('service_type', $request->input('service_type'));
                }
            }
        );

        return response()->json($applicableServiceRates);
    }

    /**
     * Build a semicolon-separated lat,lng string from a saved route record.
     */
    protected function resolveCoordinatesFromRoute(string $routeId, Request $request): ?string
    {
        $companyUuid = $request->session()->get('company');

        $route = Route::where('company_uuid', $companyUuid)
            ->where('uuid', $routeId)
            ->with(['order.payload.pickup', 'order.payload.dropoff'])
            ->first();

        if (!$route) {
            return null;
        }

        $points = [];

        $polyline = data_get($route, 'details.polyline', []);
        if (is_array($polyline)) {
            foreach ($polyline as $point) {
                if (!is_array($point) || count($point) < 2) {
                    continue;
                }

                $points[] = [(float) $point[0], (float) $point[1]];
            }
        }

        if (count($points) < 2) {
            $this->appendPayloadPlacePoints($points, data_get($route, 'order.payload'));
        }

        if (count($points) < 2) {
            $assignmentOrderIds = collect(data_get($route, 'details.assignments', []))
                ->pluck('order_id')
                ->filter()
                ->unique();

            foreach ($assignmentOrderIds as $orderId) {
                $order = Order::withTrashed()
                    ->where('company_uuid', $companyUuid)
                    ->where(function ($query) use ($orderId) {
                        $query->where('public_id', $orderId)->orWhere('uuid', $orderId);
                    })
                    ->with(['payload.pickup', 'payload.dropoff'])
                    ->first();

                if (!$order) {
                    continue;
                }

                $this->appendPayloadPlacePoints($points, $order->payload);

                if (count($points) >= 2) {
                    break;
                }
            }
        }

        if (empty($points)) {
            return null;
        }

        return collect($points)
            ->unique(fn ($point) => round($point[0], 6) . ',' . round($point[1], 6))
            ->map(fn ($point) => "{$point[0]},{$point[1]}")
            ->implode(';');
    }

    /**
     * @param array<int, array{0: float, 1: float}> $points
     */
    protected function appendPayloadPlacePoints(array &$points, $payload): void
    {
        if (!$payload) {
            return;
        }

        foreach (['pickup', 'dropoff'] as $key) {
            $place = data_get($payload, $key);
            if (!$place) {
                continue;
            }

            $latitude  = Utils::getLatitudeFromCoordinates($place);
            $longitude = Utils::getLongitudeFromCoordinates($place);

            if ($latitude == 0 && $longitude == 0) {
                continue;
            }

            $points[] = [$latitude, $longitude];
        }
    }

    /**
     * Export the service rate to excel or csv.
     *
     * @return \Illuminate\Http\Response
     */
    public static function export(ExportRequest $request)
    {
        $format       = $request->input('format', 'xlsx');
        $selections   = $request->array('selections');
        $fileName     = trim(Str::slug('contacts-' . date('Y-m-d-H:i')) . '.' . $format);

        return Excel::download(new ServiceRateExport($selections), $fileName);
    }
}
