<?php

namespace Fleetbase\FleetOps\Support;

use Fleetbase\FleetOps\Models\OrderConfig;
use Illuminate\Support\Str;

class TransportOrderConfigFlowUpgrader
{
    /**
     * Legacy patterns upgraded by the one-time transport flow migration.
     */
    public const LEGACY_ACTIVITY_CODES = ['started', 'enroute'];

    public static function transportConfigQuery(?string $companyUuid = null)
    {
        $query = OrderConfig::query()
            ->where(function ($q) {
                $q->where('namespace', 'system:order-config:transport')
                    ->orWhere(function ($q2) {
                        $q2->where('key', 'transport')->where('core_service', 1);
                    });
            });

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        return $query;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function indexFlowByCode(?array $flow): array
    {
        if (!is_array($flow)) {
            return [];
        }

        $indexed = [];

        foreach ($flow as $key => $node) {
            if (!is_array($node)) {
                continue;
            }

            $code = strtolower((string) ($node['code'] ?? $key));
            if ($code !== '' && $code !== 'activities') {
                $indexed[$code] = $node;
            }
        }

        foreach ($flow['activities'] ?? [] as $node) {
            if (!is_array($node)) {
                continue;
            }

            $code = strtolower((string) ($node['code'] ?? ''));
            if ($code !== '') {
                $indexed[$code] = $node;
            }
        }

        return $indexed;
    }

    public static function flowCodes(?array $flow): array
    {
        return array_keys(static::indexFlowByCode($flow));
    }

    public static function isCanonicalTransportFlow(?array $flow): bool
    {
        $codes = static::flowCodes($flow);

        foreach (['created', 'dispatched', 'en_route', 'delivered', 'completed'] as $required) {
            if (!in_array($required, $codes, true)) {
                return false;
            }
        }

        foreach (static::LEGACY_ACTIVITY_CODES as $legacy) {
            if (in_array($legacy, $codes, true)) {
                return false;
            }
        }

        $indexed = static::indexFlowByCode($flow);

        return in_array('en_route', array_map('strtolower', $indexed['dispatched']['activities'] ?? []), true)
            && in_array('delivered', array_map('strtolower', $indexed['en_route']['activities'] ?? []), true)
            && in_array('completed', array_map('strtolower', $indexed['delivered']['activities'] ?? []), true);
    }

    public static function isLegacyTransportFlow(?array $flow): bool
    {
        if (!is_array($flow) || $flow === []) {
            return true;
        }

        if (static::isCanonicalTransportFlow($flow)) {
            return false;
        }

        $codes = static::flowCodes($flow);

        foreach (static::LEGACY_ACTIVITY_CODES as $legacy) {
            if (in_array($legacy, $codes, true)) {
                return true;
            }
        }

        if (!in_array('en_route', $codes, true) || !in_array('delivered', $codes, true)) {
            return true;
        }

        $indexed = static::indexFlowByCode($flow);
        $dispatchNext = array_map('strtolower', $indexed['dispatched']['activities'] ?? []);

        return in_array('started', $dispatchNext, true) && !in_array('en_route', $dispatchNext, true);
    }

    public static function describeFlow(?array $flow): string
    {
        $codes = static::flowCodes($flow);

        return $codes === [] ? '(empty)' : implode(' → ', $codes);
    }

    /**
     * Build canonical flow, preserving internalId values for matching activity codes.
     */
    public static function buildUpgradedFlow(?array $existingFlow = null): array
    {
        $canonical = FleetOps::defaultTransportFlow();
        $existing  = static::indexFlowByCode($existingFlow);

        foreach ($canonical as $code => &$node) {
            $previous = $existing[$code] ?? null;
            if (is_array($previous) && !empty($previous['internalId'])) {
                $node['internalId'] = $previous['internalId'];
            }
        }
        unset($node);

        return $canonical;
    }

    public static function shouldUpgrade(OrderConfig $config, bool $force = false): bool
    {
        if ($force) {
            return true;
        }

        if (static::isCanonicalTransportFlow($config->flow)) {
            return (string) $config->version !== FleetOps::TRANSPORT_CONFIG_VERSION;
        }

        return static::isLegacyTransportFlow($config->flow);
    }

    /**
     * @return array{upgraded: bool, reason: string}
     */
    public static function upgrade(OrderConfig $config, bool $dryRun = false): array
    {
        $before = static::describeFlow($config->flow);
        $after  = static::describeFlow(static::buildUpgradedFlow($config->flow));

        if ($dryRun) {
            return [
                'upgraded' => true,
                'reason'   => "{$before} => {$after}",
            ];
        }

        $config->flow    = static::buildUpgradedFlow($config->flow);
        $config->version = FleetOps::TRANSPORT_CONFIG_VERSION;
        $config->save();

        return [
            'upgraded' => true,
            'reason'   => "{$before} => {$after}",
        ];
    }
}
