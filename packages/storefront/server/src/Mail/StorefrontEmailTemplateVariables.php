<?php

namespace Fleetbase\Storefront\Mail;

use Fleetbase\FleetOps\Models\Order;
use Fleetbase\Storefront\Models\Network;
use Fleetbase\Storefront\Models\Store;

class StorefrontEmailTemplateVariables
{
    public static function companyUuidForOrder(Order $order): ?string
    {
        return session('company') ?? data_get($order, 'company.uuid');
    }

    /**
     * @return array<string, mixed>
     */
    public static function storefrontOrderVariables(Store|Network $storefront, Order $order, ?string $driverName = null): array
    {
        return [
            'storeName' => $storefront->name,
            'driverName' => $driverName ?? data_get($order, 'driverAssigned.name'),
        ];
    }
}
