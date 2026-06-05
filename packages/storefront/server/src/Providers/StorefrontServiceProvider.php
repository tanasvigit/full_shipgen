<?php

namespace Fleetbase\Storefront\Providers;

use Fleetbase\FleetOps\Providers\FleetOpsServiceProvider;
use Fleetbase\Providers\CoreServiceProvider;
use Fleetbase\Support\ServiceMode;

if (!class_exists(CoreServiceProvider::class)) {
    throw new \Exception('Storefront cannot be loaded without `fleetbase/core-api` installed!');
}

if (!class_exists(FleetOpsServiceProvider::class)) {
    throw new \Exception('Storefront cannot be loaded without `fleetbase/fleetops-api` installed!');
}

/**
 * Storefront service provider.
 */
class StorefrontServiceProvider extends CoreServiceProvider
{
    public $observers = [
        \Fleetbase\Storefront\Models\Product::class   => \Fleetbase\Storefront\Observers\ProductObserver::class,
        \Fleetbase\Storefront\Models\Network::class   => \Fleetbase\Storefront\Observers\NetworkObserver::class,
        \Fleetbase\Storefront\Models\Catalog::class   => \Fleetbase\Storefront\Observers\CatalogObserver::class,
        \Fleetbase\Storefront\Models\FoodTruck::class => \Fleetbase\Storefront\Observers\FoodTruckObserver::class,
        \Fleetbase\Models\Company::class              => \Fleetbase\Storefront\Observers\CompanyObserver::class,
    ];

    public $middleware = [
        'storefront.api' => [
            \Fleetbase\Storefront\Http\Middleware\ThrottleRequests::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Fleetbase\Storefront\Http\Middleware\SetStorefrontSession::class,
            \Fleetbase\Http\Middleware\ConvertStringBooleans::class,
            \Fleetbase\Http\Middleware\SetGlobalHeaders::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \Fleetbase\Http\Middleware\LogApiRequests::class,
        ],
    ];

    public $commands = [
        \Fleetbase\Storefront\Console\Commands\NotifyStorefrontOrderNearby::class,
        \Fleetbase\Storefront\Console\Commands\SendOrderNotification::class,
        \Fleetbase\Storefront\Console\Commands\PurgeExpiredCarts::class,
        \Fleetbase\Storefront\Console\Commands\MigrateStripeSandboxCustomers::class,
    ];

    public function register()
    {
        if (!ServiceMode::bootsStorefrontPackage()) {
            return;
        }

        $this->app->register(CoreServiceProvider::class);
        $this->app->register(FleetOpsServiceProvider::class);
    }

    public function boot()
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/database.connections.php', 'database.connections');
        $this->mergeConfigFrom(__DIR__ . '/../../config/storefront.php', 'storefront');
        // Shared schema: register migrations on every container (including iam-service) so
        // installer migrate creates fleetbase_storefront tables before storefront-service starts.
        $this->loadMigrationsFrom(__DIR__ . '/../../migrations');

        if (!ServiceMode::bootsStorefrontPackage()) {
            return;
        }

        $this->registerCommands();
        $this->scheduleCommands(function ($schedule) {
            $schedule->command('storefront:notify-order-nearby')->everyMinute()->storeOutputInDb();
            $schedule->command('storefront:purge-carts')->daily()->storeOutputInDb();
        });
        $this->registerObservers();
        $this->registerMiddleware();
        $this->registerExpansionsFrom(__DIR__ . '/../Expansions');

        if (ServiceMode::loadsStorefrontRoutes()) {
            $this->loadRoutesFrom(__DIR__ . '/../routes.php');
        }

        $this->mergeConfigFrom(__DIR__ . '/../../config/api.php', 'storefront.api');
    }
}
