<?php

namespace Fleetbase\FleetOps\Support;

use Fleetbase\FleetOps\Exceptions\UserAlreadyExistsException;
use Fleetbase\FleetOps\Models\Contact;
use Fleetbase\FleetOps\Models\ServiceQuote;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderPartyResolver
{
    /**
     * Resolve facilitator/customer identifiers into morph columns on order input.
     */
    public static function apply(array &$input, Request $request, ?ServiceQuote $serviceQuote = null, bool $integratedVendorOrder = false): void
    {
        if ($integratedVendorOrder && $serviceQuote?->integratedVendor) {
            $input['facilitator_uuid'] = $serviceQuote->integratedVendor->uuid;
            $input['facilitator_type'] = Utils::getModelClassName('integrated_vendors');
            unset($input['facilitator']);

            static::applyCustomer($input);

            return;
        }

        static::applyFacilitator($input);
        static::applyCustomer($input);
    }

    protected static function applyFacilitator(array &$input): void
    {
        if (!isset($input['facilitator']) || $input['facilitator'] === '' || $input['facilitator'] === null) {
            return;
        }

        $facilitator = static::resolveParty(
            ['contacts', 'vendors', 'integrated_vendors'],
            $input['facilitator']
        );

        if ($facilitator) {
            $input['facilitator_uuid'] = $facilitator['uuid'];
            $input['facilitator_type'] = Utils::getModelClassName($facilitator['table']);
        }

        unset($input['facilitator']);
    }

    protected static function applyCustomer(array &$input): void
    {
        if (!isset($input['customer']) || $input['customer'] === '' || $input['customer'] === null) {
            return;
        }

        $customer = $input['customer'];

        if (is_string($customer)) {
            $resolved = static::resolveParty(['contacts', 'vendors'], $customer);

            if ($resolved) {
                $input['customer_uuid'] = $resolved['uuid'];
                $input['customer_type'] = Utils::getModelClassName($resolved['table']);
            }
        } elseif (is_array($customer)) {
            $customerData = Arr::only($customer, ['internal_id', 'name', 'title', 'email', 'phone', 'meta']);

            try {
                $contact = Contact::firstOrCreate(
                    [
                        'company_uuid' => session('company'),
                        'email'        => $customerData['email'] ?? null,
                        'type'         => 'customer',
                    ],
                    [
                        ...$customerData,
                        'company_uuid' => session('company'),
                        'type'         => 'customer',
                    ]
                );
            } catch (UserAlreadyExistsException $e) {
                $existingUser = $e->getUser();
                $contact      = Contact::where([
                    'company_uuid' => session('company'),
                    'email'        => $customerData['email'] ?? null,
                    'type'         => 'customer',
                ])->first();

                if ($existingUser && $contact) {
                    $contact->assignUser($existingUser);
                }
            } catch (\Exception $e) {
                return;
            }

            if ($contact instanceof Contact) {
                $input['customer_uuid'] = $contact->uuid;
                $input['customer_type'] = Utils::getModelClassName($contact);
            }
        }

        unset($input['customer']);
    }

    /**
     * @return array{uuid: string, table: string}|null
     */
    protected static function resolveParty(array $tables, string $identifier): ?array
    {
        if ($identifier === '') {
            return null;
        }

        $companyUuid = session('company');

        foreach ($tables as $table) {
            $tableName = Str::snake($table);

            $query = DB::table(Utils::pluralize($tableName))
                ->select(['uuid'])
                ->where('company_uuid', $companyUuid);

            if (Str::isUuid($identifier)) {
                $query->where('uuid', $identifier);
            } else {
                $query->where('public_id', $identifier);
            }

            $row = $query->first();

            if ($row?->uuid) {
                return [
                    'uuid'  => $row->uuid,
                    'table' => $tableName,
                ];
            }
        }

        return null;
    }
}
