<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\Attributes\SkipAuthorizationCheck;
use Fleetbase\FleetOps\Exports\IssueExport;
use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Imports\IssueImport;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\Issue;
use Fleetbase\Http\Requests\ExportRequest;
use Fleetbase\Http\Requests\ImportRequest;
use Fleetbase\Models\Permission;
use Fleetbase\Support\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class IssueController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'issue';

    /**
     * Allow fleet admins to create any issue; drivers may only report for themselves.
     *
     * @return \Illuminate\Http\Response
     */
    #[SkipAuthorizationCheck]
    public function createRecord(Request $request)
    {
        if ($this->canCreateIssueForOthers($request)) {
            return parent::createRecord($request);
        }

        return $this->createSelfDriverIssue($request);
    }

    /**
     * Fleet admins see all issues; drivers see only their own reports.
     *
     * @return \Illuminate\Http\Response
     */
    #[SkipAuthorizationCheck]
    public function queryRecord(Request $request)
    {
        if ($this->canListIssuesForOthers($request)) {
            return parent::queryRecord($request);
        }

        $driver = $this->resolveSessionDriver($request);
        if (!$driver) {
            return response()->authorizationError();
        }

        $records = Issue::where('driver_uuid', $driver->uuid)->orderByDesc('created_at')->get();
        $resourceClass = $this->indexResource ?? $this->resource;
        $resourceClass::wrap($this->resourcePluralName);

        return $resourceClass::collection($records);
    }

    protected function canListIssuesForOthers(Request $request): bool
    {
        $user = Auth::getUserFromSession($request);
        if (!$user || $user->isAdmin()) {
            return true;
        }

        $required = Permission::findByNames([
            'fleet-ops list issue',
            'fleet-ops * issue',
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

    protected function canCreateIssueForOthers(Request $request): bool
    {
        $user = Auth::getUserFromSession($request);
        if (!$user || $user->isAdmin()) {
            return true;
        }

        $required = Permission::findByNames([
            'fleet-ops create issue',
            'fleet-ops * issue',
            'fleet-ops *',
        ]);

        return !$user->doesntHavePermissions($required);
    }

    protected function authorizeSelfDriverForIssue(string $driverId, Request $request)
    {
        $user = Auth::getUserFromSession($request);
        if (!$user || $user->isAdmin()) {
            return null;
        }

        $driver = Driver::findById($driverId);
        if (!$driver) {
            return response()->error('Driver reporting issue not found.', 404);
        }

        if ($driver->user_uuid === $user->uuid) {
            return null;
        }

        return response()->authorizationError();
    }

    protected function createSelfDriverIssue(Request $request)
    {
        $input = $request->array('issue');

        $validator = Validator::make($input, [
            'driver'   => ['required'],
            'location' => ['required'],
            'report'   => ['required'],
            'category' => ['nullable'],
            'type'     => ['nullable'],
            'priority' => ['nullable'],
            'status'   => ['nullable'],
        ]);

        if ($validator->fails()) {
            return response()->error($validator->errors()->first(), 422);
        }

        if ($response = $this->authorizeSelfDriverForIssue($input['driver'], $request)) {
            return $response;
        }

        $driver = Driver::findById($input['driver']);
        if (!$driver) {
            return response()->error('Driver reporting issue not found.', 404);
        }

        $issue = Issue::create([
            'company_uuid'     => session('company') ?: $driver->company_uuid,
            'driver_uuid'      => $driver->uuid,
            'reported_by_uuid' => $driver->user_uuid,
            'vehicle_uuid'     => $driver->vehicle_uuid,
            'location'         => $input['location'],
            'category'         => $input['category'] ?? null,
            'type'             => $input['type'] ?? null,
            'report'           => $input['report'],
            'priority'         => $input['priority'] ?? null,
            'status'           => $input['status'] ?? null,
        ]);

        $this->afterSave($request, $issue);

        $this->resource::wrap($this->resourceSingularlName);

        return new $this->resource($issue);
    }

    /**
     * Handle post save transactions.
     */
    public function afterSave(Request $request, Issue $issue)
    {
        $customFieldValues = $request->array('issue.custom_field_values');
        if ($customFieldValues) {
            $issue->syncCustomFieldValues($customFieldValues);
        }
    }

    /**
     * Export the issue to excel or csv.
     *
     * @return \Illuminate\Http\Response
     */
    public function export(ExportRequest $request)
    {
        $format       = $request->input('format', 'xlsx');
        $selections   = $request->array('selections');
        $fileName     = trim(Str::slug('issue-' . date('Y-m-d-H:i')) . '.' . $format);

        return Excel::download(new IssueExport($selections), $fileName);
    }

    /**
     * Process import files (excel,csv) into Fleetbase order data.
     *
     * @return \Illuminate\Http\Response
     */
    public function import(ImportRequest $request)
    {
        $disk           = $request->input('disk', config('filesystems.default'));
        $files          = $request->resolveFilesFromIds();
        $importedCount  = 0;

        foreach ($files as $file) {
            try {
                $import = new IssueImport();
                Excel::import($import, $file->path, $disk);
                $importedCount += $import->imported;
            } catch (\Throwable $e) {
                return response()->error('Invalid file, unable to proccess.');
            }
        }

        return response()->json(['status' => 'ok', 'message' => 'Import completed', 'imported' => $importedCount]);
    }
}
