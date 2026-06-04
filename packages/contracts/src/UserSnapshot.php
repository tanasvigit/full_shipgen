<?php

namespace Shipgen\Contracts;

/**
 * Immutable user reference passed between services (no cross-DB User model).
 */
final class UserSnapshot
{
    public function __construct(
        public readonly string $uuid,
        public readonly ?string $name = null,
        public readonly ?string $email = null,
        public readonly bool $isAdmin = false,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            uuid: (string) $data['uuid'],
            name: isset($data['name']) ? (string) $data['name'] : null,
            email: isset($data['email']) ? (string) $data['email'] : null,
            isAdmin: (bool) ($data['is_admin'] ?? false),
        );
    }

    public function toArray(): array
    {
        return [
            'uuid'      => $this->uuid,
            'name'      => $this->name,
            'email'     => $this->email,
            'is_admin'  => $this->isAdmin,
        ];
    }
}
