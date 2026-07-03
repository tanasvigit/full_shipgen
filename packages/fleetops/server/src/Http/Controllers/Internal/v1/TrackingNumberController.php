<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Http\Resources\v1\Index\TrackingNumber as TrackingNumberIndexResource;
use Illuminate\Http\Request;

class TrackingNumberController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'tracking_number';

    /**
     * Lightweight resource for list/index responses.
     *
     * @var string
     */
    public $indexResource = TrackingNumberIndexResource::class;

    /**
     * Eager-load owner for list views.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     */
    public static function onQueryRecord($query, Request $request): void
    {
        $query->with(['owner']);
    }
}
