<?php

namespace Fleetbase\Http\Controllers\Internal\v1;

use Fleetbase\Exceptions\FleetbaseRequestValidationException;
use Fleetbase\Exports\PolicyExport;
use Fleetbase\Http\Controllers\FleetbaseController;
use Fleetbase\Http\Requests\ExportRequest;
use Fleetbase\Models\Permission;
use Fleetbase\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class PolicyController extends FleetbaseController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'policy';

    /**
     * The service which this controller belongs to.
     *
     * @var string
     */
    public $service = 'iam';

    /**
     * Creates a record by an identifier with request payload.
     *
     * @return \Illuminate\Http\Response
     */
    public function createRecord(Request $request)
    {
        try {
            $record = $this->model->createRecordFromRequest($request, null, function ($request, &$policy) {
                if ($request->isArray('policy.permissions')) {
                    $permissions = Permission::whereIn('id', $request->array('policy.permissions'))->get();
                    $policy->syncPermissions($permissions);
                }
            });

            return ['policy' => new $this->resource($record)];
        } catch (\Exception $e) {
            return response()->error($e->getMessage());
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->error($e->getMessage());
        } catch (FleetbaseRequestValidationException $e) {
            return response()->error($e->getErrors());
        }
    }

    /**
     * Updates a record by an identifier with request payload.
     *
     * @return \Illuminate\Http\Response
     */
    public function updateRecord(Request $request, string $id)
    {
        try {
            $record = $this->model->updateRecordFromRequest($request, $id, function ($request, &$policy) {
                if ($request->isArray('policy.permissions')) {
                    $permissions = Permission::whereIn('id', $request->array('policy.permissions'))->get();
                    $policy->syncPermissions($permissions);
                }
            });

            return ['policy' => new $this->resource($record)];
        } catch (\Exception $e) {
            return response()->error($e->getMessage());
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->error($e->getMessage());
        } catch (FleetbaseRequestValidationException $e) {
            return response()->error($e->getErrors());
        }
    }

    /**
     * Deletes a policy record.
     *
     * @return \Illuminate\Http\Response
     */
    public function deleteRecord($id, Request $request)
    {
        $id     = $request->segment(4);
        $policy = Policy::find($id);

        if (!$policy) {
            return response()->error('Unable to find policy for deletion.');
        }

        $policy->delete();

        return response()->json(['status' => 'OK', 'message' => 'Policy deleted.']);
    }

    /**
     * Export policies to excel or csv.
     *
     * @return \Illuminate\Http\Response
     */
    public function export(ExportRequest $request)
    {
        $format     = $request->input('format', 'xlsx');
        $selections = $request->array('selections');
        $fileName   = trim(Str::slug('policies-' . date('Y-m-d-H:i')) . '.' . $format);

        return Excel::download(new PolicyExport($selections), $fileName);
    }
}
