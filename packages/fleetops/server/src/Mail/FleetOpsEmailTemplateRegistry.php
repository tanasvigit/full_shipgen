<?php

namespace Fleetbase\FleetOps\Mail;

use Fleetbase\Mail\EmailTemplateRegistry;

class FleetOpsEmailTemplateRegistry
{
    public static function register(): void
    {
        EmailTemplateRegistry::addTemplatePath(__DIR__ . '/../../email-templates');

        EmailTemplateRegistry::registerMany([
            'fleetops.work-order-dispatched' => [
                'subject' => 'fleetops/work-order-dispatched.subject',
                'body' => 'fleetops/work-order-dispatched.body',
                'package' => 'fleetops',
            ],
            'fleetops.customer-credentials' => [
                'subject' => 'fleetops/customer-credentials.subject',
                'body' => 'fleetops/customer-credentials.body',
                'package' => 'fleetops',
            ],
            'fleetops.maintenance-reminder' => [
                'subject' => 'fleetops/maintenance-reminder.subject',
                'body' => 'fleetops/maintenance-reminder.body',
                'package' => 'fleetops',
            ],
            'fleetops.order-assigned' => [
                'subject' => 'fleetops/order-assigned.subject',
                'body' => 'fleetops/order-assigned.body',
                'package' => 'fleetops',
            ],
            'fleetops.order-dispatched' => [
                'subject' => 'fleetops/order-dispatched.subject',
                'body' => 'fleetops/order-dispatched.body',
                'package' => 'fleetops',
            ],
            'fleetops.order-canceled' => [
                'subject' => 'fleetops/order-canceled.subject',
                'body' => 'fleetops/order-canceled.body',
                'package' => 'fleetops',
            ],
            'fleetops.order-completed' => [
                'subject' => 'fleetops/order-completed.subject',
                'body' => 'fleetops/order-completed.body',
                'package' => 'fleetops',
            ],
            'fleetops.order-failed' => [
                'subject' => 'fleetops/order-failed.subject',
                'body' => 'fleetops/order-failed.body',
                'package' => 'fleetops',
            ],
            'fleetops.order-dispatch-failed' => [
                'subject' => 'fleetops/order-dispatch-failed.subject',
                'body' => 'fleetops/order-dispatch-failed.body',
                'package' => 'fleetops',
            ],
            'fleetops.driver-shift-changed' => [
                'subject' => 'fleetops/driver-shift-changed.subject',
                'body' => 'fleetops/driver-shift-changed.body',
                'package' => 'fleetops',
            ],
            'fleetops.driver-arrived-geofence' => [
                'subject' => 'fleetops/driver-arrived-geofence.subject',
                'body' => 'fleetops/driver-arrived-geofence.body',
                'package' => 'fleetops',
            ],
            'fleetops.waypoint-completed' => [
                'subject' => 'fleetops/waypoint-completed.subject',
                'body' => 'fleetops/waypoint-completed.body',
                'package' => 'fleetops',
            ],
            'fleetops.order-split' => [
                'subject' => 'fleetops/order-split.subject',
                'body' => 'fleetops/order-split.body',
                'package' => 'fleetops',
            ],
        ]);
    }
}
