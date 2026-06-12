<?php

namespace Fleetbase\FleetOps\Orchestration\Engines;

use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Models\Vehicle;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * DriverAssignmentEngine.
 *
 * Greedy shift-aware engine for matching available drivers to vehicles that
 * have planned orders (vehicle_assigned_uuid set, driver_assigned_uuid null).
 *
 * Matching priority:
 *   1. Driver is online and on an active shift
 *   2. Driver skills satisfy the required skills of the vehicle's planned orders
 *   3. Driver is geographically closest to the vehicle's current location
 *
 * This engine does not use VROOM — it is a deterministic greedy pass.
 * For V2, a VROOM-based multi-depot driver assignment can replace this.
 */
class DriverAssignmentEngine
{
    /**
     * Assign available drivers to vehicles with planned orders.
     *
     * @param Collection $orders   Orders with vehicle_assigned_uuid set but no driver
     * @param Collection $vehicles Vehicles to assign drivers to
     * @param array      $options  Options: require_active_shift (bool, default true)
     *
     * @return array{assignments: array, unassigned: array, summary: array}
     */
    public function assign(Collection $orders, Collection $vehicles, array $options = []): array
    {
        $requireActiveShift = $options['require_active_shift'] ?? false;
        $respectSkills      = $options['respect_skills'] ?? true;

        // Collect all company drivers — online status and vehicle linkage are
        // treated as soft preferences (scored), not hard filters.
        $companyUuid      = $orders->first()?->company_uuid;
        $availableDrivers = Driver::where('company_uuid', $companyUuid)
            ->with(['scheduleItems'])
            ->get();

        // Shift-awareness: if require_active_shift is explicitly set, filter
        // to drivers that have an active shift right now. Drivers with NO
        // schedule items at all are treated as always available — only drivers
        // with a schedule but no active shift are excluded.
        if ($requireActiveShift) {
            $availableDrivers = $availableDrivers->filter(function (Driver $driver) {
                $hasSchedule = $driver->scheduleItems && $driver->scheduleItems->isNotEmpty();
                // No schedule → always available
                if (!$hasSchedule) {
                    return true;
                }

                // Has a schedule → must have an active shift right now
                return $driver->activeShiftFor(now()) !== null;
            });
        }

        if ($availableDrivers->isEmpty()) {
            return [
                'assignments' => [],
                'unassigned'  => $vehicles->pluck('public_id')->toArray(),
                'summary'     => ['message' => 'No available drivers found.'],
            ];
        }

        $assignments        = [];
        $assignedDrivers    = [];
        $assignedVehicles   = [];
        $unassignedOrders   = [];

        // Determine if this is a standalone run (no prior vehicle assignment)
        // or a post-vehicle-assignment run.
        $hasVehicleAssignments = $orders->filter(fn ($o) => !empty($o->vehicle_assigned_uuid))->isNotEmpty();

        if ($hasVehicleAssignments) {
            // ── Post-vehicle-assignment mode ──────────────────────────────────
            // Orders already have a vehicle. Group by vehicle and find the
            // best driver for each vehicle group.
            $ordersByVehicle = $orders->groupBy('vehicle_assigned_uuid');

            foreach ($vehicles as $vehicle) {
                $vehicleOrders  = $ordersByVehicle->get($vehicle->uuid, collect());
                $requiredSkills = $this->aggregateRequiredSkills($vehicleOrders);

                $bestDriver = $this->findBestDriver(
                    $vehicle,
                    $availableDrivers->reject(fn ($d) => in_array($d->uuid, $assignedDrivers)),
                    $requiredSkills,
                    $respectSkills
                );

                if (!$bestDriver) {
                    foreach ($vehicleOrders as $order) {
                        $unassignedOrders[] = $order->public_id;
                    }
                    continue;
                }

                $assignedDrivers[] = $bestDriver->uuid;

                foreach ($vehicleOrders as $order) {
                    $assignments[] = [
                        'order_id'   => $order->public_id,
                        'vehicle_id' => $vehicle->public_id,
                        'driver_id'  => $bestDriver->public_id,
                        'sequence'   => null,
                    ];
                }
            }
        } else {
            // ── Standalone mode ───────────────────────────────────────────────
            // No prior vehicle assignment. Assign each order to the nearest
            // available vehicle + best matching driver pair.
            $availableVehicles = $vehicles->values();

            foreach ($orders as $order) {
                // Find the nearest unassigned vehicle
                $pickupLat = $order->payload?->pickup?->location?->getLat();
                $pickupLng = $order->payload?->pickup?->location?->getLng();

                $bestVehicle = $availableVehicles
                    ->reject(fn ($v) => in_array($v->uuid, $assignedVehicles))
                    ->sortBy(function ($vehicle) use ($pickupLat, $pickupLng) {
                        if (!$pickupLat || !$pickupLng || !$vehicle->location) {
                            return PHP_INT_MAX;
                        }

                        return $this->haversineDistance(
                            $pickupLat, $pickupLng,
                            $vehicle->location->getLat(), $vehicle->location->getLng()
                        );
                    })
                    ->first();

                if (!$bestVehicle) {
                    $unassignedOrders[] = $order->public_id;
                    continue;
                }

                $requiredSkills = $order->required_skills ?? [];
                $bestDriver     = $this->findBestDriver(
                    $bestVehicle,
                    $availableDrivers->reject(fn ($d) => in_array($d->uuid, $assignedDrivers)),
                    $requiredSkills,
                    $respectSkills
                );

                if (!$bestDriver) {
                    $unassignedOrders[] = $order->public_id;
                    continue;
                }

                $assignedVehicles[] = $bestVehicle->uuid;
                $assignedDrivers[]  = $bestDriver->uuid;

                $assignments[] = [
                    'order_id'   => $order->public_id,
                    'vehicle_id' => $bestVehicle->public_id,
                    'driver_id'  => $bestDriver->public_id,
                    'sequence'   => null,
                ];
            }
        }

        return [
            'assignments' => $assignments,
            'unassigned'  => $unassignedOrders,
            'summary'     => [
                'drivers_assigned'    => count($assignedDrivers),
                'vehicles_assigned'   => count($assignedVehicles),
            ],
        ];
    }

    /**
     * Fleet-schedule best-fit: assign drivers to orders using shift windows,
     * skills, pickup proximity, and soft workload balancing.
     *
     * @param Collection $orders  Unassigned orders
     * @param Collection $drivers Candidate drivers (pre-filtered by caller)
     * @param array      $options require_active_shift, respect_scheduled_at, respect_skills
     *
     * @return array{assignments: array, unassigned: array, summary: array}
     */
    public function assignBestFit(Collection $orders, Collection $drivers, array $options = []): array
    {
        $requireActiveShift   = $options['require_active_shift'] ?? true;
        $respectScheduledAt   = $options['respect_scheduled_at'] ?? true;
        $respectSkills        = $options['respect_skills'] ?? true;

        if ($orders->isEmpty()) {
            return [
                'assignments' => [],
                'unassigned'  => [],
                'summary'     => ['message' => 'No orders to assign.'],
            ];
        }

        if ($drivers->isEmpty()) {
            return [
                'assignments' => [],
                'unassigned'  => $orders->map(fn (Order $order) => [
                    'order_id' => $order->public_id,
                    'reason'   => 'no_drivers',
                ])->values()->all(),
                'summary'     => ['message' => 'No drivers available.'],
            ];
        }

        $drivers = $drivers->loadMissing(['scheduleItems', 'vehicle']);

        $sortedOrders = $orders->sortBy([
            fn (Order $order) => $order->scheduled_at
                ? Carbon::parse($order->scheduled_at)->timestamp
                : PHP_INT_MAX,
            fn (Order $order) => -((int) ($order->orchestrator_priority ?? 50)),
        ])->values();

        $assignments = [];
        $unassigned  = [];
        $driverLoad  = [];

        foreach ($sortedOrders as $order) {
            $referenceAt = ($respectScheduledAt && $order->scheduled_at)
                ? Carbon::parse($order->scheduled_at)
                : now();

            $pickupLat = $order->payload?->pickup?->location?->getLat();
            $pickupLng = $order->payload?->pickup?->location?->getLng();
            if (!$pickupLat || !$pickupLng) {
                $pickupLat = $order->payload?->dropoff?->location?->getLat();
                $pickupLng = $order->payload?->dropoff?->location?->getLng();
            }

            $requiredSkills = $order->required_skills ?? [];
            $candidates     = $drivers;

            if ($requireActiveShift) {
                $candidates = $candidates->filter(function (Driver $driver) use ($referenceAt) {
                    $hasSchedule = $driver->scheduleItems && $driver->scheduleItems->isNotEmpty();
                    if (!$hasSchedule) {
                        return true;
                    }

                    return $driver->activeShiftFor($referenceAt) !== null;
                });
            }

            if ($candidates->isEmpty()) {
                $unassigned[] = [
                    'order_id' => $order->public_id,
                    'reason'   => 'no_shift',
                ];
                continue;
            }

            $bestDriver = $this->findBestDriverForOrder(
                $candidates,
                $requiredSkills,
                $respectSkills,
                $pickupLat,
                $pickupLng,
                $referenceAt,
                $driverLoad
            );

            if (!$bestDriver) {
                $unassigned[] = [
                    'order_id' => $order->public_id,
                    'reason'   => 'no_match',
                ];
                continue;
            }

            $driverLoad[$bestDriver->uuid] = ($driverLoad[$bestDriver->uuid] ?? 0) + 1;

            $assignments[] = [
                'order_id'   => $order->public_id,
                'driver_id'  => $bestDriver->public_id,
                'vehicle_id' => $bestDriver->vehicle?->public_id,
                'sequence'   => null,
            ];
        }

        return [
            'assignments' => $assignments,
            'unassigned'  => $unassigned,
            'summary'     => [
                'orders_assigned'   => count($assignments),
                'orders_unassigned' => count($unassigned),
                'drivers_used'      => count($driverLoad),
            ],
        ];
    }

    /**
     * Score drivers for a single order (fleet schedule / best-fit).
     */
    protected function findBestDriverForOrder(
        Collection $availableDrivers,
        array $requiredSkills,
        bool $respectSkills,
        ?float $pickupLat,
        ?float $pickupLng,
        \DateTimeInterface $referenceAt,
        array $driverLoad,
    ): ?Driver {
        if ($availableDrivers->isEmpty()) {
            return null;
        }

        $scored = $availableDrivers->map(function (Driver $driver) use (
            $requiredSkills,
            $respectSkills,
            $pickupLat,
            $pickupLng,
            $referenceAt,
            $driverLoad
        ) {
            $score = 0;

            if ($respectSkills && !empty($requiredSkills)) {
                $driverSkills = $driver->skills ?? [];
                $matchCount   = count(array_intersect($requiredSkills, $driverSkills));
                if ($matchCount < count($requiredSkills)) {
                    return null;
                }
                $score += $matchCount * 100;
            }

            if ($driver->online) {
                $score += 30;
            }

            $hasSchedule = $driver->scheduleItems && $driver->scheduleItems->isNotEmpty();
            if ($hasSchedule && $driver->activeShiftFor($referenceAt) !== null) {
                $score += 50;
            }

            if ($pickupLat && $pickupLng && $driver->location) {
                $distance = $this->haversineDistance(
                    $pickupLat,
                    $pickupLng,
                    $driver->location->getLat(),
                    $driver->location->getLng()
                );
                $score += max(0, 50 - ($distance / 1000));
            }

            $score -= (($driverLoad[$driver->uuid] ?? 0) * 15);

            return ['driver' => $driver, 'score' => $score];
        })->filter()->sortByDesc('score');

        return $scored->first()['driver'] ?? null;
    }

    /**
     * Find the best available driver for a given vehicle.
     *
     * Scoring:
     *   - Skills match: +100 per matching skill
     *   - Active shift: +50
     *   - Proximity: inversely proportional to distance (max +50)
     */
    protected function findBestDriver(
        Vehicle $vehicle,
        Collection $availableDrivers,
        array $requiredSkills,
        bool $respectSkills,
    ): ?Driver {
        if ($availableDrivers->isEmpty()) {
            return null;
        }

        $vehicleLat = $vehicle->location?->getLat();
        $vehicleLng = $vehicle->location?->getLng();

        $scored = $availableDrivers->map(function (Driver $driver) use (
            $requiredSkills, $respectSkills, $vehicleLat, $vehicleLng
        ) {
            $score = 0;

            // Skills check
            if ($respectSkills && !empty($requiredSkills)) {
                $driverSkills = $driver->skills ?? [];
                $matchCount   = count(array_intersect($requiredSkills, $driverSkills));
                if ($matchCount < count($requiredSkills)) {
                    // Driver does not meet all required skills — disqualify
                    return null;
                }
                $score += $matchCount * 100;
            }

            // Online bonus
            if ($driver->online) {
                $score += 30;
            }
            // Active shift bonus — only meaningful if the driver has a schedule
            $hasSchedule = $driver->scheduleItems && $driver->scheduleItems->isNotEmpty();
            if ($hasSchedule && $driver->activeShiftFor(now()) !== null) {
                $score += 50;
            }

            if ($vehicleLat && $vehicleLng && $driver->location) {
                $distance = $this->haversineDistance(
                    $vehicleLat, $vehicleLng,
                    $driver->location->getLat(), $driver->location->getLng()
                );
                // Closer = higher score; cap at 50 points for distance ≤ 1 km
                $proximityScore = max(0, 50 - ($distance / 1000));
                $score += $proximityScore;
            }

            return ['driver' => $driver, 'score' => $score];
        })->filter()->sortByDesc('score');

        return $scored->first()['driver'] ?? null;
    }

    /**
     * Aggregate the unique required skills from a collection of orders.
     */
    protected function aggregateRequiredSkills(Collection $orders): array
    {
        return $orders->flatMap(fn ($o) => $o->required_skills ?? [])->unique()->values()->toArray();
    }

    /**
     * Calculate the Haversine distance in metres between two lat/lng points.
     */
    protected function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // metres
        $dLat        = deg2rad($lat2 - $lat1);
        $dLng        = deg2rad($lng2 - $lng1);
        $a           = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
