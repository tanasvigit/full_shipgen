<?php

namespace Fleetbase\Ledger\Providers;

use Fleetbase\Ledger\Events\PaymentFailed;
use Fleetbase\Ledger\Events\PaymentSucceeded;
use Fleetbase\Ledger\Events\RefundProcessed;
use Fleetbase\Ledger\Listeners\HandleFailedPayment;
use Fleetbase\Ledger\Listeners\HandleProcessedRefund;
use Fleetbase\Ledger\Listeners\HandleSuccessfulPayment;
use Fleetbase\Ledger\PaymentGatewayManager;
use Fleetbase\Ledger\Services\InvoiceService;
use Fleetbase\Ledger\Services\LedgerService;
use Fleetbase\Ledger\Services\PaymentService;
use Fleetbase\Ledger\Services\WalletService;
use Fleetbase\Providers\CoreServiceProvider;
use Fleetbase\Support\ServiceMode;
use Fleetbase\Services\TemplateRenderService;
use Illuminate\Support\Facades\Event;

if (!class_exists(CoreServiceProvider::class)) {
    throw new \Exception('Ledger cannot be loaded without `fleetbase/core-api` installed!');
}

/**
 * LedgerServiceProvider.
 */
class LedgerServiceProvider extends CoreServiceProvider
{
    public $observers = [
        \Fleetbase\Ledger\Models\Invoice::class => \Fleetbase\Ledger\Observers\InvoiceObserver::class,
        \Fleetbase\Models\Company::class        => \Fleetbase\Ledger\Observers\CompanyObserver::class,
        \Fleetbase\Models\User::class           => \Fleetbase\Ledger\Observers\UserObserver::class,
        'Fleetbase\\FleetOps\\Models\\PurchaseRate' => \Fleetbase\Ledger\Observers\PurchaseRateObserver::class,
        'Fleetbase\\FleetOps\\Models\\Order'        => \Fleetbase\Ledger\Observers\StorefrontOrderObserver::class,
    ];

    public function register()
    {
        if (!ServiceMode::bootsLedgerPackage()) {
            return;
        }

        $this->app->register(CoreServiceProvider::class);

        $this->app->singleton(LedgerService::class);
        $this->app->singleton(WalletService::class);
        $this->app->singleton(InvoiceService::class);

        $this->app->singleton(PaymentGatewayManager::class, function ($app) {
            return new PaymentGatewayManager($app);
        });

        $this->app->alias(PaymentGatewayManager::class, 'ledger.gateway');

        $this->app->singleton(PaymentService::class, function ($app) {
            return new PaymentService($app->make(PaymentGatewayManager::class));
        });
    }

    public function boot()
    {
        // Shared schema: register migrations on every container (including iam-service) so
        // installer migrate creates ledger tables before ledger-service handles API requests.
        $this->loadMigrationsFrom(__DIR__ . '/../../migrations');

        if (!ServiceMode::bootsLedgerPackage()) {
            return;
        }

        $this->registerObservers();
        $this->registerExpansionsFrom(__DIR__ . '/../Expansions');

        if (ServiceMode::loadsLedgerRoutes()) {
            $this->loadRoutesFrom(__DIR__ . '/../routes.php');
        }

        $this->registerPaymentEvents();
        $this->registerInvoiceTemplateContext();

        if ($this->app->runningInConsole()) {
            $this->commands([
                \Fleetbase\Ledger\Console\Commands\ProvisionLedgerDefaults::class,
                \Fleetbase\Ledger\Console\Commands\BackfillTransactionDirection::class,
                \Fleetbase\Ledger\Console\Commands\UpdateOverdueInvoices::class,
            ]);
        }
    }

    private function registerPaymentEvents(): void
    {
        Event::listen(PaymentSucceeded::class, HandleSuccessfulPayment::class);
        Event::listen(PaymentFailed::class, HandleFailedPayment::class);
        Event::listen(RefundProcessed::class, HandleProcessedRefund::class);
    }

    private function registerInvoiceTemplateContext(): void
    {
        if (!class_exists(TemplateRenderService::class) || !method_exists(TemplateRenderService::class, 'registerContextType')) {
            return;
        }

        TemplateRenderService::registerContextType('invoice', [
            'label'       => 'Invoice',
            'description' => 'Variables available when rendering a Ledger invoice template.',
            'model'       => \Fleetbase\Ledger\Models\Invoice::class,
            'variables'   => [
                ['name' => 'number',       'path' => 'invoice.number',       'type' => 'string',   'description' => 'Invoice number'],
                ['name' => 'date',         'path' => 'invoice.date',         'type' => 'date',     'description' => 'Invoice date'],
                ['name' => 'due_date',     'path' => 'invoice.due_date',     'type' => 'date',     'description' => 'Payment due date'],
                ['name' => 'status',       'path' => 'invoice.status',       'type' => 'string',   'description' => 'Invoice status (draft, sent, paid, overdue, etc.)'],
                ['name' => 'currency',     'path' => 'invoice.currency',     'type' => 'string',   'description' => 'ISO 4217 currency code'],
                ['name' => 'subtotal',     'path' => 'invoice.subtotal',     'type' => 'currency', 'description' => 'Subtotal before tax'],
                ['name' => 'tax',          'path' => 'invoice.tax',          'type' => 'currency', 'description' => 'Total tax amount'],
                ['name' => 'total_amount', 'path' => 'invoice.total_amount', 'type' => 'currency', 'description' => 'Total amount including tax'],
                ['name' => 'amount_paid',  'path' => 'invoice.amount_paid',  'type' => 'currency', 'description' => 'Amount already paid'],
                ['name' => 'balance',      'path' => 'invoice.balance',      'type' => 'currency', 'description' => 'Outstanding balance'],
                ['name' => 'notes',        'path' => 'invoice.notes',        'type' => 'string',   'description' => 'Invoice notes'],
                ['name' => 'terms',        'path' => 'invoice.terms',        'type' => 'string',   'description' => 'Payment terms'],
                ['name' => 'transaction.reference',       'path' => 'transaction.reference',       'type' => 'string',   'description' => 'Transaction reference number'],
                ['name' => 'transaction.amount',          'path' => 'transaction.amount',          'type' => 'currency', 'description' => 'Transaction amount'],
                ['name' => 'transaction.currency',        'path' => 'transaction.currency',        'type' => 'string',   'description' => 'Transaction currency'],
                ['name' => 'transaction.status',          'path' => 'transaction.status',          'type' => 'string',   'description' => 'Transaction status'],
                ['name' => 'transaction.payment_method',  'path' => 'transaction.payment_method',  'type' => 'string',   'description' => 'Payment method used'],
                ['name' => 'transaction.settled_at',      'path' => 'transaction.settled_at',      'type' => 'datetime', 'description' => 'When the transaction was settled'],
                ['name' => 'transaction.notes',           'path' => 'transaction.notes',           'type' => 'string',   'description' => 'Transaction notes'],
                ['name' => 'account.name',     'path' => 'account.name',     'type' => 'string',   'description' => 'Account name'],
                ['name' => 'account.code',     'path' => 'account.code',     'type' => 'string',   'description' => 'Account code'],
                ['name' => 'account.type',     'path' => 'account.type',     'type' => 'string',   'description' => 'Account type'],
                ['name' => 'account.balance',  'path' => 'account.balance',  'type' => 'currency', 'description' => 'Account balance'],
                ['name' => 'account.currency', 'path' => 'account.currency', 'type' => 'string',   'description' => 'Account currency'],
                ['name' => 'account.status',   'path' => 'account.status',   'type' => 'string',   'description' => 'Account status'],
                ['name' => 'wallet.name',              'path' => 'wallet.name',              'type' => 'string',   'description' => 'Wallet name'],
                ['name' => 'wallet.balance',           'path' => 'wallet.balance',           'type' => 'currency', 'description' => 'Wallet balance (in smallest currency unit)'],
                ['name' => 'wallet.formatted_balance', 'path' => 'wallet.formatted_balance', 'type' => 'string',   'description' => 'Human-readable wallet balance with currency symbol'],
                ['name' => 'wallet.currency',          'path' => 'wallet.currency',          'type' => 'string',   'description' => 'Wallet currency'],
                ['name' => 'wallet.status',            'path' => 'wallet.status',            'type' => 'string',   'description' => 'Wallet status'],
            ],
        ]);
    }
}
