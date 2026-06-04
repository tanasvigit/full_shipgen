<?php

namespace Fleetbase\Support;

/**
 * Which route/domain bundles load for the current container (FLEETBASE_SERVICE).
 */
final class ServiceMode
{
    public static function current(): ?string
    {
        $value = env('FLEETBASE_SERVICE');

        return ($value === null || $value === '') ? null : (string) $value;
    }

    public static function isIam(): bool
    {
        return self::current() === 'iam';
    }

    public static function isMonolith(): bool
    {
        return self::current() === 'monolith';
    }

    public static function isFleetops(): bool
    {
        return self::current() === 'fleetops';
    }

    public static function isPallet(): bool
    {
        return self::current() === 'pallet';
    }

    public static function isLedger(): bool
    {
        return self::current() === 'ledger';
    }

    public static function isStorefront(): bool
    {
        return self::current() === 'storefront';
    }

    /** Legacy full stack (unset) or monolith: registry bridge only. */
    public static function loadsRegistryRoutes(): bool
    {
        $current = self::current();

        return $current === null || $current === 'monolith';
    }

    /** @deprecated Use loadsRegistryRoutes() */
    public static function loadsMonolithDomains(): bool
    {
        return self::loadsRegistryRoutes();
    }

    /** core-api internal IAM routes. */
    public static function loadsIamRoutes(): bool
    {
        $current = self::current();

        return $current === null || $current === 'iam';
    }

    /** core-api public v1 routes. */
    public static function loadsCorePublicApi(): bool
    {
        return !self::isIam()
            && !self::isFleetops()
            && !self::isPallet()
            && !self::isLedger()
            && !self::isStorefront();
    }

    /** fleetops HTTP routes. */
    public static function loadsFleetopsRoutes(): bool
    {
        $current = self::current();

        return $current === null || $current === 'fleetops';
    }

    /** pallet HTTP routes. */
    public static function loadsPalletRoutes(): bool
    {
        $current = self::current();

        return $current === null || $current === 'pallet';
    }

    /** ledger HTTP routes. */
    public static function loadsLedgerRoutes(): bool
    {
        $current = self::current();

        return $current === null || $current === 'ledger';
    }

    /** storefront HTTP routes. */
    public static function loadsStorefrontRoutes(): bool
    {
        $current = self::current();

        return $current === null || $current === 'storefront';
    }

    /** Observers, schedules, migrations for FleetOps (all except IAM-only). */
    public static function bootsFleetopsPackage(): bool
    {
        return !self::isIam();
    }

    /** Pallet package boot (migrations); pallet + legacy + monolith schedulers. */
    public static function bootsPalletPackage(): bool
    {
        $current = self::current();

        return $current === null || $current === 'monolith' || $current === 'pallet';
    }

    /** Ledger package boot. */
    public static function bootsLedgerPackage(): bool
    {
        $current = self::current();

        return $current === null || $current === 'monolith' || $current === 'ledger';
    }

    /** Storefront package boot (incl. schedules on monolith). */
    public static function bootsStorefrontPackage(): bool
    {
        $current = self::current();

        return $current === null || $current === 'monolith' || $current === 'storefront';
    }
}
