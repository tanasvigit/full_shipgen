<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\Attributes\SkipAuthorizationCheck;
use Fleetbase\FleetOps\Exports\FuelReportExport;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Imports\FuelReportImport;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\FuelReport;
use Fleetbase\Http\Requests\ExportRequest;
use Fleetbase\Http\Requests\ImportRequest;
use Fleetbase\Models\Permission;
use Fleetbase\Support\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class FuelReportController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'fuel_report';

    /**
     * Allow fleet admins to create any fuel report; drivers may only report for themselves.
     *
     * @return \Illuminate\Http\Response
     */
    #[SkipAuthorizationCheck]
    public function createRecord(Request $request)
    {
        if ($this->canCreateFuelReportForOthers($request)) {
            return parent::createRecord($request);
        }

        return $this->createSelfDriverFuelReport($request);
    }

    /**
     * Fleet admins see all fuel reports; drivers see only their own entries.
     *
     * @return \Illuminate\Http\Response
     */
    #[SkipAuthorizationCheck]
    public function queryRecord(Request $request)
    {
        if ($this->canListFuelReportsForOthers($request)) {
            return parent::queryRecord($request);
        }

        $driver = $this->resolveSessionDriver($request);
        if (!$driver) {
            return response()->authorizationError();
        }

        $records = FuelReport::where('driver_uuid', $driver->uuid)->orderByDesc('created_at')->get();
        $resourceClass = $this->indexResource ?? $this->resource;
        $resourceClass::wrap($this->resourcePluralName);

        return $resourceClass::collection($records);
    }

    protected function canListFuelReportsForOthers(Request $request): bool
    {
        $user = Auth::getUserFromSession($request);
        if (!$user || $user->isAdmin()) {
            return true;
        }

        $required = Permission::findByNames([
            'fleet-ops list fuel-report',
            'fleet-ops list fuel_report',
            'fleet-ops * fuel-report',
            'fleet-ops * fuel_report',
            'fleet-ops *',
        ]);

        return !$user->doesntHavePermissions($required);
    }

    protected function resolveSessionDriver(Request $request): ?Driver
    {
        $user = Auth::getUserFromSession($request);
        if (!$user) {
            return null;
        }

        return Driver::where('user_uuid', $user->uuid)->first();
    }

    protected function canCreateFuelReportForOthers(Request $request): bool
    {
        $user = Auth::getUserFromSession($request);
        if (!$user || $user->isAdmin()) {
            return true;
        }

        $required = Permission::findByNames([
            'fleet-ops create fuel-report',
            'fleet-ops create fuel_report',
            'fleet-ops * fuel-report',
            'fleet-ops * fuel_report',
            'fleet-ops *',
        ]);

        return !$user->doesntHavePermissions($required);
    }

    protected function authorizeSelfDriverForFuelReport(string $driverId, Request $request)
    {
        $user = Auth::getUserFromSession($request);
        if (!$user || $user->isAdmin()) {
            return null;
        }

        $driver = Driver::findById($driverId);
        if (!$driver) {
            return response()->error('Driver reporting fuel report not found.', 404);
        }

        if ($driver->user_uuid === $user->uuid) {
            return null;
        }

        return response()->authorizationError();
    }

    protected function createSelfDriverFuelReport(Request $request)
    {
        $input = $request->array('fuel_report');

        $validator = Validator::make($input, [
            'driver'      => ['required'],
            'odometer'    => ['required'],
            'volume'      => ['required'],
            'metric_unit' => ['nullable'],
            'location'    => ['nullable'],
            'amount'      => ['nullable'],
            'currency'    => ['nullable'],
            'status'      => ['nullable'],
        ]);

        if ($validator->fails()) {
            return response()->error($validator->errors()->first(), 422);
        }

        if ($response = $this->authorizeSelfDriverForFuelReport($input['driver'], $request)) {
            return $response;
        }

        $driver = Driver::findById($input['driver']);
        if (!$driver) {
            return response()->error('Driver reporting fuel report not found.', 404);
        }

        $fuelReport = FuelReport::create([
            'company_uuid'     => session('company') ?: $driver->company_uuid,
            'driver_uuid'      => $driver->uuid,
            'reported_by_uuid' => $driver->user_uuid,
            'vehicle_uuid'     => $driver->vehicle_uuid,
            'odometer'         => $input['odometer'],
            'volume'           => $input['volume'],
            'metric_unit'      => $input['metric_unit'] ?? null,
            'location'         => $input['location'] ?? null,
            'amount'           => $input['amount'] ?? null,
            'currency'         => $input['currency'] ?? null,
            'status'           => $input['status'] ?? null,
        ]);

        $this->afterSave($request, $fuelReport);

        $this->resource::wrap($this->resourceSingularlName);

        return new $this->resource($fuelReport);
    }

    /**
     * Handle post save transactions.
     */
    public function afterSave(Request $request, FuelReport $fuelReport)
    {
        $customFieldValues = $request->array('fuel_report.custom_field_values');
        if ($customFieldValues) {
            $fuelReport->syncCustomFieldValues($customFieldValues);
        }
    }

    /**
     * Export the fleets to excel or csv.
     *
     * @return \Illuminate\Http\Response
     */
    public function export(ExportRequest $request)
    {
        $format       = $request->input('format', 'xlsx');
        $selections   = $request->array('selections');
        $fileName     = trim(Str::slug('fuel_report-' . date('Y-m-d-H:i')) . '.' . $format);

        return Excel::download(new FuelReportExport($selections), $fileName);
    }

    public function import(ImportRequest $request)
    {
        $disk           = $request->input('disk', config('filesystems.default'));
        $files          = $request->resolveFilesFromIds();
        $importedCount  = 0;

        foreach ($files as $file) {
            try {
                $import = new FuelReportImport();
                Excel::import($import, $file->path, $disk);
                $importedCount += $import->imported;
            } catch (\Throwable $e) {
                return response()->error('Invalid file, unable to proccess.');
            }
        }

        return response()->json(['status' => 'ok', 'message' => 'Import completed', 'imported' => $importedCount]);
    }
}
