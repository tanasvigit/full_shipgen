<?php

namespace Fleetbase\Exports;

use Fleetbase\Models\Policy;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class PolicyExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting, ShouldAutoSize
{
    protected array $selections = [];

    public function __construct(array $selections = [])
    {
        $this->selections = $selections;
    }

    public function map($policy): array
    {
        return [
            $policy->name,
            $policy->description,
            $policy->service,
            $policy->type,
            $policy->permissions?->pluck('name')->filter()->implode(', '),
            $policy->created_at,
        ];
    }

    public function headings(): array
    {
        return [
            'Name',
            'Description',
            'Service',
            'Type',
            'Permissions',
            'Date Created',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'F' => NumberFormat::FORMAT_DATE_DDMMYYYY,
        ];
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        $query = Policy::query()
            ->where(function ($builder) {
                $builder->where('company_uuid', session('company'))
                    ->orWhereNull('company_uuid');
            })
            ->with(['permissions']);

        if (!empty($this->selections)) {
            $query->whereIn('id', $this->selections);
        }

        return $query->get();
    }
}
