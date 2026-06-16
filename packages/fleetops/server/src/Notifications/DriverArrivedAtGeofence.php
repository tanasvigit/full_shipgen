<?php

namespace Fleetbase\FleetOps\Notifications;

use Fleetbase\FleetOps\Models\Order;
use Fleetbase\Mail\Concerns\RendersVelocityEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * DriverArrivedAtGeofence.
 *
 * Sent to the order customer when a driver enters the geofence associated
 * with the order's current destination waypoint.
 *
 * Delivery channels: mail and database.
 */
class DriverArrivedAtGeofence extends Notification
{
    use Queueable;
    use RendersVelocityEmail;

    /**
     * The order associated with the arrival.
     */
    protected Order $order;

    /**
     * The geofence that was entered (Zone or ServiceArea).
     */
    protected $geofence;

    /**
     * Create a new DriverArrivedAtGeofence notification.
     *
     * @param mixed $geofence Zone or ServiceArea
     */
    public function __construct(Order $order, $geofence)
    {
        $this->order    = $order;
        $this->geofence = $geofence;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        $orderId = $this->order->public_id ?? $this->order->uuid;

        return $this->velocityMail('fleetops.driver-arrived-geofence', [
            'orderId' => $orderId,
            'geofenceName' => $this->geofence->name ?? 'your location',
            'trackUrl' => url('/tracking/' . $this->order->tracking_number),
        ]);
    }

    /**
     * Get the array representation of the notification (database channel).
     */
    public function toArray($notifiable): array
    {
        return [
            'event'         => 'driver.arrived_at_geofence',
            'order_id'      => $this->order->public_id,
            'order_uuid'    => $this->order->uuid,
            'geofence_id'   => $this->geofence->public_id ?? null,
            'geofence_name' => $this->geofence->name ?? null,
            'message'       => sprintf(
                'Your driver has arrived at %s for order #%s.',
                $this->geofence->name ?? 'your location',
                $this->order->public_id
            ),
        ];
    }
}
