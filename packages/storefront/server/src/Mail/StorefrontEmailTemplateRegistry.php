<?php

namespace Fleetbase\Storefront\Mail;

use Fleetbase\Mail\EmailTemplateRegistry;

class StorefrontEmailTemplateRegistry
{
    public static function register(): void
    {
        EmailTemplateRegistry::addTemplatePath(__DIR__ . '/../../email-templates');

        EmailTemplateRegistry::registerMany([
            'storefront.network-invite' => [
                'subject' => 'storefront/network-invite.subject',
                'body' => 'storefront/network-invite.body',
                'package' => 'storefront',
            ],
            'storefront.verification-create-customer' => [
                'subject' => 'storefront/verification-create-customer.subject',
                'body' => 'storefront/verification-create-customer.body',
                'package' => 'storefront',
            ],
            'storefront.verification-account-closure' => [
                'subject' => 'storefront/verification-account-closure.subject',
                'body' => 'storefront/verification-account-closure.body',
                'package' => 'storefront',
            ],
            'storefront.order-created' => [
                'subject' => 'storefront/order-created.subject',
                'body' => 'storefront/order-created.body',
                'package' => 'storefront',
            ],
            'storefront.order-accepted' => [
                'subject' => 'storefront/order-accepted.subject',
                'body' => 'storefront/order-accepted.body',
                'package' => 'storefront',
            ],
            'storefront.order-preparing' => [
                'subject' => 'storefront/order-preparing.subject',
                'body' => 'storefront/order-preparing.body',
                'package' => 'storefront',
            ],
            'storefront.order-ready-for-pickup' => [
                'subject' => 'storefront/order-ready-for-pickup.subject',
                'body' => 'storefront/order-ready-for-pickup.body',
                'package' => 'storefront',
            ],
            'storefront.order-driver-assigned' => [
                'subject' => 'storefront/order-driver-assigned.subject',
                'body' => 'storefront/order-driver-assigned.body',
                'package' => 'storefront',
            ],
            'storefront.order-enroute' => [
                'subject' => 'storefront/order-enroute.subject',
                'body' => 'storefront/order-enroute.body',
                'package' => 'storefront',
            ],
            'storefront.order-nearby' => [
                'subject' => 'storefront/order-nearby.subject',
                'body' => 'storefront/order-nearby.body',
                'package' => 'storefront',
            ],
            'storefront.order-completed' => [
                'subject' => 'storefront/order-completed.subject',
                'body' => 'storefront/order-completed.body',
                'package' => 'storefront',
            ],
            'storefront.order-canceled' => [
                'subject' => 'storefront/order-canceled.subject',
                'body' => 'storefront/order-canceled.body',
                'package' => 'storefront',
            ],
        ]);
    }
}
