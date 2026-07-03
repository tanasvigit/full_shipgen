<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Http\Resources\v1\Index\Payload as PayloadIndexResource;
use Illuminate\Http\Request;

class PayloadController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'payload';

    /**
     * Lightweight resource for list/index responses.
     *
     * @var string
     */
    public $indexResource = PayloadIndexResource::class;

    /**
     * Eager-load pickup/dropoff for list views.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     */
    public static function onQueryRecord($query, Request $request): void
    {
        $query->with(['pickup', 'dropoff']);
    }
}
