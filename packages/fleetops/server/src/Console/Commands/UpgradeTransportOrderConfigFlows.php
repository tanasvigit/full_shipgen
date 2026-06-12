<?php

namespace Fleetbase\FleetOps\Console\Commands;

use Fleetbase\FleetOps\Support\FleetOps;
use Fleetbase\FleetOps\Support\TransportOrderConfigFlowUpgrader;
use Illuminate\Console\Command;

class UpgradeTransportOrderConfigFlows extends Command
{
    protected $signature = 'fleetops:upgrade-transport-order-config-flows
                            {--dry-run : Preview changes without writing to the database}
                            {--force : Upgrade every transport config, including customized flows}
                            {--company= : Limit to a single company UUID}';

    protected $description = 'One-time migration: upgrade legacy transport order_config flows to the canonical en_route lifecycle.';

    public function handle(): int
    {
        $dryRun  = (bool) $this->option('dry-run');
        $force   = (bool) $this->option('force');
        $company = $this->option('company');

        $this->info('Canonical transport flow: created → dispatched → en_route → delivered → completed');
        $this->line('Target config version: ' . FleetOps::TRANSPORT_CONFIG_VERSION);

        if ($dryRun) {
            $this->warn('Dry run — no database changes will be saved.');
        }

        if ($force) {
            $this->warn('Force mode — customized transport configs will be overwritten.');
        }

        $configs = TransportOrderConfigFlowUpgrader::transportConfigQuery($company)->get();

        if ($configs->isEmpty()) {
            $this->warn('No transport order configs found.');

            return self::SUCCESS;
        }

        $upgraded = 0;
        $skipped  = 0;
        $failed   = 0;

        $progress = $this->output->createProgressBar($configs->count());
        $progress->start();

        foreach ($configs as $config) {
            $progress->advance();

            try {
                if (!TransportOrderConfigFlowUpgrader::shouldUpgrade($config, $force)) {
                    $skipped++;
                    continue;
                }

                $result = TransportOrderConfigFlowUpgrader::upgrade($config, $dryRun);
                if ($result['upgraded']) {
                    $upgraded++;
                    $this->newLine();
                    $this->line(sprintf(
                        ' [%s] %s — %s',
                        $config->public_id ?? $config->uuid,
                        $config->company_uuid,
                        $result['reason']
                    ));
                }
            } catch (\Throwable $e) {
                $failed++;
                $this->newLine();
                $this->error(sprintf(
                    ' Failed %s (%s): %s',
                    $config->public_id ?? $config->uuid,
                    $config->company_uuid,
                    $e->getMessage()
                ));
            }
        }

        $progress->finish();
        $this->newLine(2);

        $this->table(
            ['Result', 'Count'],
            [
                [$dryRun ? 'Would upgrade' : 'Upgraded', $upgraded],
                ['Skipped (already canonical)', $skipped],
                ['Failed', $failed],
                ['Total scanned', $configs->count()],
            ]
        );

        if ($dryRun && $upgraded > 0) {
            $this->info('Re-run without --dry-run to apply changes.');
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
