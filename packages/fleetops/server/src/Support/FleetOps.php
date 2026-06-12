<?php

namespace Fleetbase\FleetOps\Support;

use Fleetbase\FleetOps\Models\OrderConfig;
use Fleetbase\Models\Company;
use Illuminate\Support\Str;

class FleetOps
{
    public const TRANSPORT_CONFIG_VERSION = '0.0.2';

    /**
     * Canonical default transport workflow:
     * created → dispatched → en_route → delivered → completed
     */
    public static function defaultTransportFlow(): array
    {
        return [
            'created' => [
                'key'         => 'created',
                'code'        => 'created',
                'color'       => '#64748B',
                'logic'       => [],
                'events'      => ['order.created'],
                'status'      => 'Order Created',
                'actions'     => [],
                'details'     => 'New order was created.',
                'options'     => [],
                'complete'    => false,
                'entities'    => [],
                'sequence'    => 0,
                'activities'  => ['dispatched'],
                'internalId'  => Str::uuid(),
                'pod_method'  => 'scan',
                'require_pod' => false,
            ],
            'dispatched' => [
                'key'         => 'dispatched',
                'code'        => 'dispatched',
                'color'       => '#0066FF',
                'logic'       => [],
                'events'      => ['order.dispatched'],
                'status'      => 'Order Dispatched',
                'actions'     => [],
                'details'     => 'Order has been dispatched.',
                'options'     => [],
                'complete'    => false,
                'entities'    => [],
                'sequence'    => 1,
                'activities'  => ['en_route'],
                'internalId'  => Str::uuid(),
                'pod_method'  => 'scan',
                'require_pod' => false,
            ],
            'en_route' => [
                'key'         => 'en_route',
                'code'        => 'en_route',
                'color'       => '#7C3AED',
                'logic'       => [],
                'events'      => ['order.started'],
                'status'      => 'En Route',
                'actions'     => [],
                'details'     => 'Driver is en route.',
                'options'     => [],
                'complete'    => false,
                'entities'    => [],
                'sequence'    => 2,
                'activities'  => ['delivered'],
                'internalId'  => Str::uuid(),
                'pod_method'  => 'scan',
                'require_pod' => false,
            ],
            'delivered' => [
                'key'         => 'delivered',
                'code'        => 'delivered',
                'color'       => '#059669',
                'logic'       => [],
                'events'      => [],
                'status'      => 'Delivered',
                'actions'     => [],
                'details'     => 'Order has been delivered.',
                'options'     => [],
                'complete'    => false,
                'entities'    => [],
                'sequence'    => 3,
                'activities'  => ['completed'],
                'internalId'  => Str::uuid(),
                'pod_method'  => 'scan',
                'require_pod' => true,
            ],
            'completed' => [
                'key'         => 'completed',
                'code'        => 'completed',
                'color'       => '#059669',
                'logic'       => [],
                'events'      => ['order.completed'],
                'status'      => 'Order Completed',
                'actions'     => [],
                'details'     => 'Order has been completed.',
                'options'     => [],
                'complete'    => true,
                'entities'    => [],
                'sequence'    => 4,
                'activities'  => [],
                'internalId'  => Str::uuid(),
                'pod_method'  => 'scan',
                'require_pod' => false,
            ],
        ];
    }

    /**
     * Creates or retrieves an existing transport configuration for a given company.
     *
     * @param Company $company the company for which the transport configuration is being created or retrieved
     *
     * @return OrderConfig the transport configuration associated with the specified company
     */
    public static function createTransportConfig(Company $company): OrderConfig
    {
        return OrderConfig::firstOrCreate(
            [
                'company_uuid' => $company->uuid,
                'key'          => 'transport',
                'namespace'    => 'system:order-config:transport',
            ],
            [
                'name'         => 'Transport',
                'key'          => 'transport',
                'namespace'    => 'system:order-config:transport',
                'description'  => 'Default order configuration for transport',
                'core_service' => 1,
                'status'       => 'private',
                'version'      => static::TRANSPORT_CONFIG_VERSION,
                'tags'         => ['transport', 'delivery'],
                'entities'     => [],
                'meta'         => [],
                'flow'         => static::defaultTransportFlow(),
            ]
        );
    }
}
