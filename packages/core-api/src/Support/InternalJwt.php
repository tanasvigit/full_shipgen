<?php

namespace Fleetbase\Support;

use DateTimeImmutable;
use Lcobucci\Clock\SystemClock;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Token\Plain;
use Lcobucci\JWT\Token\RegisteredClaims;
use Lcobucci\JWT\Validation\Constraint\IssuedBy;
use Lcobucci\JWT\Validation\Constraint\PermittedFor;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Constraint\LooseValidAt;

class InternalJwt
{
    public static function configuration(): Configuration
    {
        return Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::plainText((string) config('fleetbase.gateway.jwt_secret'))
        );
    }

    /**
     * Mint a short-lived JWT for service-to-service calls (gateway → domain services).
     */
    public static function mint(string $userUuid, ?string $companyUuid, array $extraClaims = []): string
    {
        $config = static::configuration();
        $now    = new DateTimeImmutable('@' . time());
        $ttl    = (int) config('fleetbase.gateway.jwt_ttl', 900);

        $builder = $config->builder()
            ->issuedBy((string) config('fleetbase.gateway.jwt_issuer', 'shipgen-iam'))
            ->permittedFor((string) config('fleetbase.gateway.jwt_audience', 'shipgen-internal'))
            ->identifiedBy(bin2hex(random_bytes(8)))
            ->issuedAt($now)
            ->canOnlyBeUsedAfter($now)
            ->expiresAt($now->modify('+' . $ttl . ' seconds'))
            ->relatedTo($userUuid);

        if ($companyUuid !== null && $companyUuid !== '') {
            $builder = $builder->withClaim('company_uuid', $companyUuid);
        }

        foreach ($extraClaims as $key => $value) {
            if ($key === 'sub') {
                continue;
            }
            $builder = $builder->withClaim($key, $value);
        }

        /** @var Plain $token */
        $token = $builder->getToken($config->signer(), $config->signingKey());

        return $token->toString();
    }

    /**
     * @return array{sub: string, company_uuid: ?string, claims: array<string, mixed>}
     */
    public static function validate(string $jwt): array
    {
        $config = static::configuration();
        $token  = $config->parser()->parse($jwt);

        if (!$token instanceof Plain) {
            throw new \InvalidArgumentException('Invalid internal JWT.');
        }

        $config->validator()->assert(
            $token,
            new SignedWith($config->signer(), $config->signingKey()),
            new IssuedBy((string) config('fleetbase.gateway.jwt_issuer', 'shipgen-iam')),
            new PermittedFor((string) config('fleetbase.gateway.jwt_audience', 'shipgen-internal')),
            new LooseValidAt(SystemClock::fromSystemTimezone())
        );

        $claims   = $token->claims();
        $userUuid = (string) $claims->get(RegisteredClaims::SUBJECT, '');

        if ($userUuid === '') {
            throw new \InvalidArgumentException('Internal JWT missing subject.');
        }

        return [
            'sub'          => $userUuid,
            'company_uuid' => $claims->has('company_uuid') ? (string) $claims->get('company_uuid') : null,
        ];
    }
}
