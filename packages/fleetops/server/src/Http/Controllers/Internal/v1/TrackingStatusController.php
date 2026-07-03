<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Illuminate\Http\Request;

class TrackingStatusController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'tracking_status';

    /**
     * Eager-load tracking number for list views.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     */
    public static function onQueryRecord($query, Request $request): void
    {
        $query->with(['trackingNumber']);
    }
}
