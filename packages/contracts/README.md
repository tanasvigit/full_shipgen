# shipgen/contracts

Shared PHP types for microservice boundaries:

- `UserSnapshot` — identity passed between IAM and domain services
- `Events\DomainEvent` — base envelope for Redis/async events

Wire into Laravel apps via Composer path repository when extracting `services/*`:

```json
"repositories": [{ "type": "path", "url": "../../packages/contracts" }],
"require": { "shipgen/contracts": "@dev" }
```
