<?php

namespace Fleetbase\FleetOps\Http\Controllers\Internal\v1;

use Fleetbase\FleetOps\Http\Controllers\FleetOpsController;
use Fleetbase\FleetOps\Support\Utils;
use Illuminate\Http\Request;

class PurchaseRateController extends FleetOpsController
{
    /**
     * The resource to query.
     *
     * @var string
     */
    public $resource = 'purchase_rate';

    /**
     * @return \Illuminate\Http\Response
     */
    public function createRecord(Request $request)
    {
        $this->normalizePurchaseRateInput($request);

        return parent::createRecord($request);
    }

    /**
     * @param mixed $id
     *
     * @return \Illuminate\Http\Response
     */
    public function updateRecord(Request $request, $id)
    {
        $this->normalizePurchaseRateInput($request);

        return parent::updateRecord($request, $id);
    }

    /**
     * Map public IDs from the console payload to UUID columns the model persists.
     */
    protected function normalizePurchaseRateInput(Request $request): void
    {
        $payload = $request->or(['purchase_rate', 'purchaseRate']);
        if (!is_array($payload)) {
            return;
        }

        $companyUuid = $request->session()->get('company');
        $changed     = false;

        if (!empty($payload['service_quote']) && empty($payload['service_quote_uuid'])) {
            $payload['service_quote_uuid'] = Utils::getUuid('service_quotes', [
                'public_id'    => $payload['service_quote'],
                'company_uuid' => $companyUuid,
            ]);
            $changed = true;
        } elseif (!empty($payload['service_quote_uuid']) && empty($payload['service_quote'])) {
            $quote = \Fleetbase\FleetOps\Models\ServiceQuote::where('uuid', $payload['service_quote_uuid'])
                ->where('company_uuid', $companyUuid)
                ->first();
            if ($quote) {
                $payload['service_quote'] = $quote->public_id;
                $changed                  = true;
            }
        }

        if (!empty($payload['payload']) && empty($payload['payload_uuid'])) {
            $payload['payload_uuid'] = Utils::getUuid('payloads', [
                'public_id'    => $payload['payload'],
                'company_uuid' => $companyUuid,
            ]);
            $changed = true;
        }

        if (!empty($payload['customer']) && empty($payload['customer_uuid'])) {
            // getUuid returns just the uuid string by default; request the matched
            // table too so we can resolve the correct polymorphic customer_type.
            $customer = Utils::getUuid(
                ['contacts', 'vendors'],
                [
                    'public_id'    => $payload['customer'],
                    'company_uuid' => $companyUuid,
                ],
                ['with_table' => true]
            );

            if (is_array($customer) && Utils::get($customer, 'uuid')) {
                $isVendor = Utils::get($customer, 'table') === 'vendors'
                    || \Illuminate\Support\Str::startsWith((string) $payload['customer'], 'vendor_');

                $payload['customer_uuid'] = Utils::get($customer, 'uuid');
                $payload['customer_type'] = $isVendor
                    ? \Fleetbase\FleetOps\Models\Vendor::class
                    : \Fleetbase\FleetOps\Models\Contact::class;
                $changed = true;
            }
        }

        if ($changed) {
            $request->merge([
                'purchase_rate' => $payload,
                'purchaseRate'  => $payload,
                ...$payload,
            ]);
        }
    }
}
