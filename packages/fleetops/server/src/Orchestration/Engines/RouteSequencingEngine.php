<?php

namespace Fleetbase\FleetOps\Orchestration\Engines;

use Fleetbase\FleetOps\Support\OSRM;
use Fleetbase\FleetOps\Support\Utils;
use Fleetbase\LaravelMysqlSpatial\Types\Point as SpatialPoint;
use Illuminate\Support\Collection;

/**
 * RouteSequencingEngine.
 *
 * Used for the `optimize_routes` orchestration mode.
 *
 * Unlike the allocation engines (Greedy, VROOM), this engine does NOT
 * re-assign orders to vehicles. Instead it:
 *
 *   1. Groups the provided orders by their already-assigned vehicle
 *      (vehicle_assigned_uuid).
 *   2. For each vehicle group, sequences the stops in an optimal order
 *      using a nearest-neighbour TSP heuristic.
 *   3. Returns one assignment entry per order, preserving the existing
 *      vehicle_id / driver_id and updating only the sequence number.
 *
 * This ensures that running "Assign Vehicles" followed by "Optimize Routes"
 * produces one properly-sequenced route per vehicle rather than re-running
 * the allocation algorithm.
 */
class RouteSequencingEngine
{
    /**
     * Sequence stops for each vehicle group.
     *
     * @param Collection $orders  Orders with payload.pickup, payload.dropoff, payload.waypoints loaded
     * @param array      $options Engine options (currently unused, reserved for future use)
     *
     * @return array Standard orchestration result: { assignments, unassigned, summary }
     */
    public function sequence(Collection $orders, array $options = []): array
    {
        $assignments  = [];
        $unassigned   = [];
        $allStops     = [];
        $allPolyline  = [];
        $totalDistance = 0;
        $totalDuration = 0;

        // Group orders by their currently assigned vehicle UUID
        $byVehicle = [];
        foreach ($orders as $order) {
            $vehicleUuid = $order->vehicle_assigned_uuid ?? null;
            if (!$vehicleUuid) {
                // Order has no vehicle assignment — cannot sequence it
                $unassigned[] = $order->public_id;
                continue;
            }
            $byVehicle[$vehicleUuid][] = $order;
        }

        foreach ($byVehicle as $vehicleUuid => $vehicleOrders) {
            $vehicle = $vehicleOrders[0]->vehicle ?? null;

            // Determine driver public_id from the vehicle relationship
            $driverPublicId = null;
            if ($vehicle && $vehicle->driver) {
                $driverPublicId = $vehicle->driver->public_id ?? null;
            }

            // Get vehicle's current location as the starting point for sequencing
            $startLat = null;
            $startLng = null;
            if ($vehicle) {
                $driver   = $vehicle->driver;
                $location = $driver?->location ?? $vehicle->location;
                $startLat = $location?->getLat();
                $startLng = $location?->getLng();
            }

            // Build a flat list of stops: each order contributes pickup + dropoff
            // (or waypoints for multi-drop orders). We keep pickup before its own
            // dropoff as a hard constraint.
            $sequenced = $this->_sequenceOrdersForVehicle($vehicleOrders, $startLat, $startLng);

            foreach ($sequenced as $seq => $stop) {
                $allStops[] = [
                    'order_id' => $stop['order_public_id'],
                    'sequence' => $seq + 1,
                    'lat'      => $stop['lat'],
                    'lng'      => $stop['lng'],
                    'type'     => $stop['type'],
                ];
            }

            $routeMetrics = $this->_routeMetricsForStops($sequenced);
            $totalDistance += $routeMetrics['distance'];
            $totalDuration += $routeMetrics['duration'];
            foreach ($routeMetrics['polyline'] as $point) {
                $allPolyline[] = $point;
            }

            // Build assignment entries — one per order, with the sequence number
            // being the position of the order's FIRST stop in the sequenced list.
            $orderSequences = [];
            foreach ($sequenced as $seq => $stop) {
                $orderId = $stop['order_public_id'];
                // Only record the first occurrence (pickup position) per order
                if (!isset($orderSequences[$orderId])) {
                    $orderSequences[$orderId] = $seq + 1; // 1-based
                }
            }

            foreach ($vehicleOrders as $order) {
                $orderDistance = $this->_orderLegDistance($order);
                $assignments[] = [
                    'order_id'          => $order->public_id,
                    'vehicle_id'        => $vehicle?->public_id ?? $vehicleUuid,
                    'driver_id'         => $driverPublicId,
                    'sequence'          => $orderSequences[$order->public_id] ?? 1,
                    'waypoint_sequence' => null,
                    'arrival'           => null,
                    'duration'          => $orderDistance > 0 ? (int) round($orderDistance / 11.11) : null,
                    'distance'          => $orderDistance > 0 ? (int) round($orderDistance) : null,
                ];
            }
        }

        if (count($allPolyline) < 2 && count($allStops) >= 2) {
            $allPolyline = array_map(fn ($stop) => [$stop['lat'], $stop['lng']], $allStops);
        }

        if ($totalDistance === 0 && count($allStops) >= 2) {
            $totalDistance = (int) round($this->_pathDistance($allStops));
            $totalDuration = $totalDistance > 0 ? (int) round($totalDistance / 11.11) : 0;
        }

        return [
            'assignments' => $assignments,
            'unassigned'  => $unassigned,
            'stops'       => $allStops,
            'polyline'    => $allPolyline,
            'summary'     => [
                'engine'             => 'route_sequencing',
                'assigned'           => count($assignments),
                'unassigned'         => count($unassigned),
                'total_distance_m'   => $totalDistance,
                'total_duration_s'   => $totalDuration,
                'total_distance'     => $totalDistance,
                'total_duration'     => $totalDuration,
            ],
        ];
    }

    /**
     * Sequence stops for a single vehicle's orders using nearest-neighbour TSP.
     *
     * Constraints:
     *   - Each order's pickup must appear before its dropoff (precedence constraint).
     *   - Starts from the vehicle/driver's current location if known.
     *
     * @param array      $orders   Array of Order models
     * @param float|null $startLat Vehicle starting latitude
     * @param float|null $startLng Vehicle starting longitude
     *
     * @return array Ordered array of stop records: { order_public_id, lat, lng, type }
     */
    protected function _sequenceOrdersForVehicle(array $orders, ?float $startLat, ?float $startLng): array
    {
        // Build a flat pool of stops with precedence constraints
        $pool = [];
        foreach ($orders as $order) {
            $payload = $order->payload;
            if (!$payload) {
                continue;
            }

            $waypoints    = $payload->waypoints;
            $hasWaypoints = $waypoints && $waypoints->count() > 0;
            $isMultiDrop  = $hasWaypoints && !$payload->pickup_uuid && !$payload->dropoff_uuid;

            if ($isMultiDrop) {
                // Multi-drop: add each waypoint as a stop
                $sorted = $waypoints->sortBy('order')->values();
                foreach ($sorted as $idx => $wp) {
                    $place = $wp->place;
                    $coords = $this->_placeCoordinates($place);
                    if (!$coords) {
                        continue;
                    }
                    $pool[] = [
                        'order_public_id'  => $order->public_id,
                        'lat'              => $coords[0],
                        'lng'              => $coords[1],
                        'type'             => 'waypoint',
                        'precedence_after' => $idx > 0 ? ($pool[count($pool) - 1]['id'] ?? null) : null,
                        'id'               => $order->public_id . '_wp_' . $idx,
                    ];
                }
            } else {
                // Standard pickup → dropoff
                $pickup  = $payload->pickup;
                $dropoff = $payload->dropoff;

                $pickupId  = $order->public_id . '_pickup';
                $dropoffId = $order->public_id . '_dropoff';

                $pickupCoords = $this->_placeCoordinates($pickup);
                if ($pickupCoords) {
                    $pool[] = [
                        'order_public_id'  => $order->public_id,
                        'lat'              => $pickupCoords[0],
                        'lng'              => $pickupCoords[1],
                        'type'             => 'pickup',
                        'precedence_after' => null, // pickup has no prerequisite
                        'id'               => $pickupId,
                        'blocks'           => $dropoffId, // dropoff must come after this
                    ];
                }

                $dropoffCoords = $this->_placeCoordinates($dropoff);
                if ($dropoffCoords) {
                    $pool[] = [
                        'order_public_id'  => $order->public_id,
                        'lat'              => $dropoffCoords[0],
                        'lng'              => $dropoffCoords[1],
                        'type'             => 'dropoff',
                        'precedence_after' => $pickupId, // must come after pickup
                        'id'               => $dropoffId,
                    ];
                }
            }
        }

        if (empty($pool)) {
            return [];
        }

        // Nearest-neighbour TSP with precedence constraints
        $visited  = [];
        $sequence = [];
        $curLat   = $startLat;
        $curLng   = $startLng;

        while (count($visited) < count($pool)) {
            $bestIdx  = null;
            $bestDist = PHP_INT_MAX;

            foreach ($pool as $idx => $stop) {
                if (in_array($idx, $visited)) {
                    continue;
                }

                // Check precedence: if this stop requires another stop to come first
                if (!empty($stop['precedence_after'])) {
                    $prerequisiteId   = $stop['precedence_after'];
                    $prerequisiteDone = false;
                    foreach ($sequence as $done) {
                        if ($done['id'] === $prerequisiteId) {
                            $prerequisiteDone = true;
                            break;
                        }
                    }
                    if (!$prerequisiteDone) {
                        continue;
                    } // not yet eligible
                }

                if ($curLat === null || $curLng === null) {
                    // No current position — just pick the first eligible stop
                    $bestIdx = $idx;
                    break;
                }

                $dist = $this->_haversine($curLat, $curLng, $stop['lat'], $stop['lng']);
                if ($dist < $bestDist) {
                    $bestDist = $dist;
                    $bestIdx  = $idx;
                }
            }

            if ($bestIdx === null) {
                // No eligible stop found — add all remaining stops in original order
                // (safety fallback to avoid infinite loop)
                foreach ($pool as $idx => $stop) {
                    if (!in_array($idx, $visited)) {
                        $visited[]  = $idx;
                        $sequence[] = $stop;
                        $curLat     = $stop['lat'];
                        $curLng     = $stop['lng'];
                    }
                }
                break;
            }

            $visited[]  = $bestIdx;
            $sequence[] = $pool[$bestIdx];
            $curLat     = $pool[$bestIdx]['lat'];
            $curLng     = $pool[$bestIdx]['lng'];
        }

        return $sequence;
    }

    /**
     * Resolve lat/lng from a Place model (location column or legacy lat/lng attrs).
     *
     * @return array{0: float, 1: float}|null
     */
    protected function _placeCoordinates($place): ?array
    {
        if (!$place) {
            return null;
        }

        $lat = Utils::getLatitudeFromCoordinates($place);
        $lng = Utils::getLongitudeFromCoordinates($place);

        if (!$lat && !$lng) {
            return null;
        }

        return [(float) $lat, (float) $lng];
    }

    /**
     * Build polyline + distance/duration for a sequenced stop list.
     *
     * @param array<int, array<string, mixed>> $stops
     *
     * @return array{polyline: array<int, array{0: float, 1: float}>, distance: int, duration: int}
     */
    protected function _routeMetricsForStops(array $stops): array
    {
        if (count($stops) < 2) {
            $polyline = count($stops) === 1 ? [[$stops[0]['lat'], $stops[0]['lng']]] : [];

            return ['polyline' => $polyline, 'distance' => 0, 'duration' => 0];
        }

        $points = array_map(
            fn ($stop) => new SpatialPoint((float) $stop['lat'], (float) $stop['lng']),
            $stops
        );

        try {
            $routeData = OSRM::getRouteFromPoints($points, [
                'overview'   => 'full',
                'geometries' => 'polyline',
            ]);
            $route = $routeData['routes'][0] ?? null;

            if (($routeData['code'] ?? null) === 'Ok' && $route && (int) ($route['distance'] ?? 0) > 0) {
                $polyline = [];
                foreach ($route['waypoints'] ?? [] as $waypoint) {
                    $polyline[] = [$waypoint->getLat(), $waypoint->getLng()];
                }

                if (count($polyline) < 2) {
                    $polyline = array_map(fn ($stop) => [$stop['lat'], $stop['lng']], $stops);
                }

                return [
                    'polyline' => $polyline,
                    'distance' => (int) round((float) ($route['distance'] ?? 0)),
                    'duration' => (int) round((float) ($route['duration'] ?? 0)),
                ];
            }
        } catch (\Throwable $e) {
            // Fall through to straight-line metrics when OSRM is unavailable or out of region.
        }

        $distance = (int) round($this->_pathDistance($stops));

        return [
            'polyline' => array_map(fn ($stop) => [$stop['lat'], $stop['lng']], $stops),
            'distance' => $distance,
            'duration' => $distance > 0 ? (int) round($distance / 11.11) : 0,
        ];
    }

    /**
     * Straight-line distance for a single order's pickup → dropoff leg.
     */
    protected function _orderLegDistance($order): float
    {
        $pickupCoords  = $this->_placeCoordinates($order->payload?->pickup);
        $dropoffCoords = $this->_placeCoordinates($order->payload?->dropoff);

        if (!$pickupCoords || !$dropoffCoords) {
            return 0;
        }

        return $this->_haversine($pickupCoords[0], $pickupCoords[1], $dropoffCoords[0], $dropoffCoords[1]);
    }

    /**
     * Sum of haversine distances across consecutive stops.
     *
     * @param array<int, array<string, mixed>> $stops
     */
    protected function _pathDistance(array $stops): float
    {
        $distance = 0.0;

        for ($i = 1, $count = count($stops); $i < $count; $i++) {
            $prev = $stops[$i - 1];
            $next = $stops[$i];
            $distance += $this->_haversine(
                (float) $prev['lat'],
                (float) $prev['lng'],
                (float) $next['lat'],
                (float) $next['lng']
            );
        }

        return $distance;
    }

    /**
     * Haversine distance in metres.
     */
    protected function _haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a    = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
