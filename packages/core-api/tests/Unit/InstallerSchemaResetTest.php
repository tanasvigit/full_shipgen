<?php

namespace Fleetbase\Tests\Unit;

use Fleetbase\Support\InstallerSchemaReset;
use PHPUnit\Framework\TestCase;

class InstallerSchemaResetTest extends TestCase
{
    public function test_extension_database_names_use_main_database_prefix(): void
    {
        $names = InstallerSchemaReset::extensionDatabaseNames('fleetbase', ['storefront', 'sandbox']);

        $this->assertSame(['fleetbase_storefront', 'fleetbase_sandbox'], $names);
    }

    public function test_extension_database_names_are_deduplicated(): void
    {
        $names = InstallerSchemaReset::extensionDatabaseNames('fleetbase', ['storefront', 'storefront']);

        $this->assertSame(['fleetbase_storefront'], $names);
    }
}
