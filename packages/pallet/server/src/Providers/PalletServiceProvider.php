<?php

namespace Fleetbase\Pallet\Providers;

use Fleetbase\FleetOps\Providers\FleetOpsServiceProvider;
use Fleetbase\Providers\CoreServiceProvider;
use Fleetbase\Support\ServiceMode;

if (!class_exists(CoreServiceProvider::class)) {
    throw new \Exception('Pallet cannot be loaded without `fleetbase/core-api` installed!');
}

if (!class_exists(FleetOpsServiceProvider::class)) {
    throw new \Exception('Pallet cannot be loaded without `fleetbase/fleetops-api` installed!');
}

/**
 * Billing extension service provider.
 */
class PalletServiceProvider extends CoreServiceProvider
{
    /**
     * The observers registered with the service provider.
     *
     * @var array
     */
    public $observers = [];

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        if (!ServiceMode::bootsPalletPackage()) {
            return;
        }

        $this->app->register(CoreServiceProvider::class);
        $this->app->register(FleetOpsServiceProvider::class);
    }

    /**
     * Bootstrap any package services.
     *
     * @return void
     */
    public function boot()
    {
        // Shared schema: register migrations on every container (including iam-service) so
        // installer migrate creates pallet tables before pallet-service handles API requests.
        $this->loadMigrationsFrom(__DIR__ . '/../../migrations');

        if (!ServiceMode::bootsPalletPackage()) {
            return;
        }

        $this->registerObservers();
        $this->registerExpansionsFrom(__DIR__ . '/../Expansions');

        if (ServiceMode::loadsPalletRoutes()) {
            $this->loadRoutesFrom(__DIR__ . '/../routes.php');
        }
    }
}
