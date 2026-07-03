<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Imports\PartImport;
use Fleetbase\FleetOps\Models\Part;
use Fleetbase\Http\Requests\ImportRequest;
use Fleetbase\Support\Http;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PartController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'part';

    /**
     * Include soft-deleted parts in list queries so inventory SKUs remain visible.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     */
    public static function onQueryRecord($query, $request): void
    {
        $query->withTrashed();
    }

    /**
     * Allow opening soft-deleted parts from the list.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     */
    public static function onFindRecord($query, $request): void
    {
        $query->withTrashed();
    }

    /**
     * Restore a soft-deleted part when the same SKU is created again.
     *
     * @return \Illuminate\Http\Response
     */
    public function createRecord(Request $request)
    {
        $input       = $this->model->getApiPayloadFromRequest($request);
        $input       = $this->model->fillSessionAttributes($input);
        $sku         = $input['sku'] ?? null;
        $companyUuid = session('company');

        if ($sku && $companyUuid) {
            $existing = Part::withTrashed()
                ->where('company_uuid', $companyUuid)
                ->where('sku', $sku)
                ->first();

            if ($existing?->trashed()) {
                $existing->restore();
                $request->merge([
                    'part' => array_merge($request->input('part', []), $input),
                    ...$input,
                ]);

                return $this->updateRecord($request, $existing->uuid);
            }
        }

        return parent::createRecord($request);
    }

    /**
     * Permanently delete parts so SKUs can be reused without ghost records.
     *
     * @param string $id
     *
     * @return \Illuminate\Http\Response
     */
    public function deleteRecord($id, Request $request)
    {
        if (Http::isInternalRequest($request)) {
            $builder = $this->model->withTrashed()->where($this->model->getKeyName(), $id);
        } else {
            $builder = $this->model->withTrashed()->wherePublicId($id);
        }

        $companyUuid = session('company');
        if ($companyUuid && $this->model->isColumn($this->model->qualifyColumn('company_uuid'))) {
            $builder->where($this->model->qualifyColumn('company_uuid'), $companyUuid);
        }

        $builder   = $this->model->applyDirectivesToQuery($request, $builder);
        $dataModel = $builder->first();

        if ($dataModel) {
            $dataModel->forceDelete();

            if (Http::isInternalRequest($request)) {
                $this->resource::wrap($this->resourceSingularlName);

                return new $this->resource($dataModel);
            }

            return response()->json([
                'status'  => 'success',
                'message' => $this->getHumanReadableResourceName() . ' deleted',
                'data'    => new $this->resource($dataModel),
            ]);
        }

        return response()->json([
            'status'  => 'failed',
            'message' => $this->getHumanReadableResourceName() . ' not found',
        ], 404);
    }

    /**
     * Process import files (excel, csv) into Part records.
     *
     * @return \Illuminate\Http\Response
     */
    public function import(ImportRequest $request)
    {
        $disk          = $request->input('disk', config('filesystems.default'));
        $files         = $request->resolveFilesFromIds();
        $importedCount = 0;

        foreach ($files as $file) {
            try {
                $import = new PartImport();
                Excel::import($import, $file->path, $disk);
                $importedCount += $import->imported;
            } catch (\Throwable $e) {
                return response()->error('Invalid file, unable to process.');
            }
        }

        return response()->json(['status' => 'ok', 'message' => 'Import completed', 'imported' => $importedCount]);
    }
}
