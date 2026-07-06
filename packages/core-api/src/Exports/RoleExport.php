<?php

namespace Fleetbase\Exports;

use Fleetbase\Models\Role;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class RoleExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting, ShouldAutoSize
{
    protected array $selections = [];

    public function __construct(array $selections = [])
    {
        $this->selections = $selections;
    }

    public function map($role): array
    {
        return [
            $role->name,
            $role->description,
            $role->service,
            $role->type,
            $role->policies?->pluck('name')->filter()->implode(', '),
            $role->permissions?->pluck('name')->filter()->implode(', '),
            $role->created_at,
        ];
    }

    public function headings(): array
    {
        return [
            'Name',
            'Description',
            'Service',
            'Type',
            'Policies',
            'Permissions',
            'Date Created',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'G' => NumberFormat::FORMAT_DATE_DDMMYYYY,
        ];
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        $query = Role::query()
            ->where(function ($builder) {
                $builder->where('company_uuid', session('company'))
                    ->orWhereNull('company_uuid');
            })
            ->with(['policies', 'permissions']);

        if (!empty($this->selections)) {
            $query->whereIn('id', $this->selections);
        }

        return $query->get();
    }
}
