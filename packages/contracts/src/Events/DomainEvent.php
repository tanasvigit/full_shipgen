<?php

namespace Shipgen\Contracts\Events;

/**
 * Base shape for async domain events (Redis Streams / queue payloads).
 */
abstract class DomainEvent
{
    public function __construct(
        public readonly string $eventId,
        public readonly string $occurredAt,
        public readonly string $companyUuid,
    ) {
    }

    abstract public function eventName(): string;

    public function envelope(): array
    {
        return [
            'event'        => $this->eventName(),
            'event_id'     => $this->eventId,
            'occurred_at'  => $this->occurredAt,
            'company_uuid' => $this->companyUuid,
            'payload'      => $this->payload(),
        ];
    }

    /** @return array<string, mixed> */
    abstract protected function payload(): array;
}
