<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Models\Telematic;
use Fleetbase\FleetOps\Models\Vehicle;
use Fleetbase\Support\Utils;

class DeviceController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'device';

    /**
     * Resolve telematic public_id/uuid to telematic_uuid before create.
     */
    public function onBeforeCreate($request, &$input): void
    {
        $this->resolveTelematicUuid($input);
        $this->resolveAttachableType($input);
    }

    /**
     * Resolve telematic public_id/uuid to telematic_uuid before update.
     */
    public function onBeforeUpdate($request, $device, &$input): void
    {
        $this->resolveTelematicUuid($input);
        $this->resolveAttachableType($input);
    }

    /**
     * Map `telematic` / public ID input to the fillable `telematic_uuid` column.
     */
    private function resolveTelematicUuid(array &$input): void
    {
        $hasTelematicKey = array_key_exists('telematic_uuid', $input) || array_key_exists('telematic', $input);
        $ref = $input['telematic_uuid'] ?? $input['telematic'] ?? null;

        if ($ref === null || $ref === '') {
            if ($hasTelematicKey) {
                $input['telematic_uuid'] = null;
            }
            unset($input['telematic']);

            return;
        }

        $telematic = Telematic::query()
            ->where('company_uuid', session('company'))
            ->where(function ($query) use ($ref) {
                $query->where('uuid', $ref)->orWhere('public_id', $ref);
            })
            ->first();

        if ($telematic) {
            $input['telematic_uuid'] = $telematic->uuid;
        }

        unset($input['telematic']);
    }

    /**
     * Normalize attachable_type short names (e.g. "vehicle") to FleetOps model classes.
     */
    private function resolveAttachableType(array &$input): void
    {
        if (!array_key_exists('attachable_type', $input) || $input['attachable_type'] === null || $input['attachable_type'] === '') {
            return;
        }

        $type = $input['attachable_type'];

        if ($type === 'vehicle' || $type === 'Fleetbase\\Models\\Vehicle' || $type === '\\Fleetbase\\Models\\Vehicle') {
            $input['attachable_type'] = Vehicle::class;

            return;
        }

        if (is_string($type) && !str_contains($type, '\\')) {
            $input['attachable_type'] = Utils::getMutationType(
                str_contains($type, ':') ? $type : 'fleet-ops:' . $type
            );
        }
    }

    /**
     * Query callback when querying record.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @param Request                            $request
     */
    public static function onQueryRecord($query, $request): void
    {
        $query->with(['telematic', 'warranty']);
    }

    /**
     * Query callback when finding record.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @param Request                            $request
     */
    public static function onFindRecord($query, $request): void
    {
        $query->with(['telematic', 'warranty']);
    }
}
