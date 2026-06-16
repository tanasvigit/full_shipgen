<?php

namespace Fleetbase\FleetOps\Mail;

use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Support\Utils;

class FleetOpsEmailTemplateVariables
{
    /**
     * @return array{actionUrl: string, actionLabel: string}
     */
    public static function orderTrackAction(Order $order): array
    {
        $tracking = data_get($order, 'trackingNumber.tracking_number', $order->public_id);

        return [
            'actionUrl' => Utils::consoleUrl('track-order', ['order' => $tracking]),
            'actionLabel' => 'Track Order',
        ];
    }

    public static function companyUuidForOrder(Order $order): ?string
    {
        return session('company') ?? data_get($order, 'company.uuid');
    }

    /**
     * @return array<string, mixed>
     */
    public static function orderMailVariables(Order $order, string $title, string $message, ?string $reason = null): array
    {
        return array_merge([
            'title' => $title,
            'message' => $message,
            'reason' => $reason ?? '',
        ], self::orderTrackAction($order));
    }
}
