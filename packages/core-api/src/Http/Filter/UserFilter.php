<?php

namespace Fleetbase\Http\Filter;

use Illuminate\Support\Facades\Schema;

class UserFilter extends Filter
{
    public function queryForInternal()
    {
        $companyUuid = $this->session->get('company');

        $this->builder->where(
            function ($query) use ($companyUuid) {
                // Include users who are already members of the company.
                $query->whereHas(
                    'companyUsers',
                    function ($q) use ($companyUuid) {
                        $q->where('company_uuid', $companyUuid);
                    }
                )
                // Also include users who have a pending invite to join the company
                // but have not yet accepted (no CompanyUser row exists yet).
                // The invites table has no user_uuid; the link is via the user's
                // email stored in the JSON recipients column.
                ->orWhereExists(function ($q) use ($companyUuid) {
                    $q->selectRaw(1)
                      ->from('invites')
                      ->whereRaw('JSON_CONTAINS(invites.recipients, JSON_QUOTE(users.email))')
                      ->where('invites.company_uuid', $companyUuid)
                      ->where('invites.reason', 'join_company')
                      ->whereNull('invites.deleted_at');
                });
            }
        );
    }

    public function queryForPublic()
    {
        $this->queryForInternal();
    }

    public function isNotAdmin()
    {
        $this->builder->where('type', '!=', 'admin');
    }

    public function isUser()
    {
        $this->builder->whereIn('type', ['user', 'admin']);
    }

    /** Filter driver accounts (IAM type or FleetOps driver profile in this company). */
    public function isDriver($value = null)
    {
        if (!$this->acceptsTruthyFilter($value)) {
            return;
        }

        $companyUuid = $this->session->get('company');

        $this->builder->where(function ($query) use ($companyUuid) {
            $query->where('type', 'driver');

            if (Schema::hasTable('drivers')) {
                $query->orWhereExists(function ($sub) use ($companyUuid) {
                    $sub->selectRaw(1)
                        ->from('drivers')
                        ->whereColumn('drivers.user_uuid', 'users.uuid')
                        ->whereNull('drivers.deleted_at');
                    if ($companyUuid) {
                        $sub->where('drivers.company_uuid', $companyUuid);
                    }
                });
            }
        });
    }

    /** Filter customer accounts. */
    public function isCustomer($value = null)
    {
        if (!$this->acceptsTruthyFilter($value)) {
            return;
        }

        $this->builder->where('type', 'customer');
    }

    private function acceptsTruthyFilter($value): bool
    {
        return !($value === null || $value === '' || $value === false || $value === 0 || $value === '0');
    }

    public function query(?string $query)
    {
        $this->builder->search($query);
    }

    public function name(?string $name)
    {
        $this->builder->searchWhere('name', $name);
    }

    public function phone(?string $phone)
    {
        $this->builder->searchWhere('phone', $phone);
    }

    public function email(?string $email)
    {
        $this->builder->searchWhere('email', $email);
    }

    public function role(?string $roleId)
    {
        $this->builder->whereHas('companyUsers', function ($query) use ($roleId) {
            $query->where('company_uuid', session('company'));
            $query->whereHas('roles', function ($query) use ($roleId) {
                $query->where('id', $roleId);
            });
        });
    }
}
