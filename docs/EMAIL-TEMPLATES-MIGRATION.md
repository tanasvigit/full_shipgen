# Email Templates Migration Plan (Apache Velocity)

This document describes the centralized Velocity email templating system introduced to Fleetbase. It replaces hardcoded `MailMessage` bodies and legacy Blade mail views while keeping the existing notification and mailable delivery flow unchanged.

## Architecture

```
Trigger (Listener / Controller / Command)
    → Notification::toMail() or Mailable::envelope()/content()   [unchanged entry points]
    → RendersVelocityEmail / RendersVelocityMailable trait
    → EmailTemplateRenderer
        1. Resolve company override from `email_templates` table (optional)
        2. Load `.vm` subject/body from package template paths
        3. VelocityEngine renders HTML + subject
        4. Wrap body in `layouts/mail.vm` (unless `layout => false`)
    → Laravel Mail / MailMessage view `fleetbase::mail.velocity`
```

### Core components

| Component | Path |
|-----------|------|
| Velocity engine | `packages/core-api/src/Mail/Velocity/VelocityEngine.php` |
| Template renderer | `packages/core-api/src/Mail/EmailTemplateRenderer.php` |
| Template registry | `packages/core-api/src/Mail/EmailTemplateRegistry.php` |
| Notification trait | `packages/core-api/src/Mail/Concerns/RendersVelocityEmail.php` |
| Mailable trait | `packages/core-api/src/Mail/Concerns/RendersVelocityMailable.php` |
| DB model | `packages/core-api/src/Models/EmailTemplate.php` |
| Migration | `packages/core-api/migrations/2026_06_15_000001_create_email_templates_table.php` |

### Template directory structure

```
packages/core-api/email-templates/
  layouts/mail.vm
  auth/
    verification.subject.vm / verification.body.vm
    verification-2fa.*
    user-credentials.*
    password-reset.*
    user-invited.*
    user-accepted-invite.*
    user-created.*
    mail-test.*
  registry/
    developer-verification.*

packages/fleetops/server/email-templates/
  fleetops/
    work-order-dispatched.*
    customer-credentials.*
    maintenance-reminder.*
    order-assigned.*
    order-dispatched.*
    order-canceled.*
    order-completed.*
    order-failed.*
    order-dispatch-failed.*
    driver-shift-changed.*
    driver-arrived-geofence.*
    waypoint-completed.*
    order-split.*

packages/storefront/server/email-templates/
  storefront/
    network-invite.*
    verification-create-customer.*
    verification-account-closure.*
    order-created.*
    order-accepted.*
    order-preparing.*
    order-ready-for-pickup.*
    order-driver-assigned.*
    order-enroute.*
    order-nearby.*
    order-completed.*
    order-canceled.*
```

Each email type uses two files unless noted:

- `{name}.subject.vm` — single-line subject (Velocity)
- `{name}.body.vm` — HTML fragment rendered into the layout

## Database changes (future user-editable templates)

### `email_templates` table

| Column | Purpose |
|--------|---------|
| `company_uuid` | `NULL` = reserved for future system rows; non-null = company override |
| `template_key` | Registry key, e.g. `fleetops.order-assigned` |
| `part` | `subject` or `body` |
| `locale` | BCP-47 locale (default `en`) |
| `content` | Velocity template source override |
| `variables_schema` | JSON schema documenting allowed variables (for future UI) |
| `is_active` | Enable/disable override |
| `version` | Versioning for rollback / audit |

**Resolution order:** company override (active, highest version) → filesystem `.vm` default.

### Future API/UI (not implemented)

- `GET /int/v1/email-templates` — list registry + overrides
- `PUT /int/v1/email-templates/{key}` — save company override
- Admin preview endpoint with sample fixture data
- Validation against `variables_schema` before save

## Full template inventory (~35 types)

### Core / IAM (9)

| Template key | Trigger | Generator class | Required variables |
|--------------|---------|-----------------|-------------------|
| `auth.verification` | Onboarding/signup verify | `VerificationMail` via `VerificationCode::generateEmailVerificationFor()` | `code`, `userName`, `currentHour`, `verifyUrl`, `showVerifyButton`, `contentOverride?` |
| `auth.verification-2fa` | 2FA email | `TwoFactorAuth` → `VerificationMail` | `code` |
| `auth.user-credentials` | Password change / recovery CLI | `UserCredentialsMail` | `userName`, `userEmail`, `plaintextPassword`, `companyName`, `currentHour` |
| `auth.password-reset` | Forgot password | `UserForgotPassword` | `notifiableName`, `code`, `resetUrl` |
| `auth.user-invited` | Company invite | `UserInvited` | `notifiableName`, `companyName`, `senderName`, `inviteCode`, `inviteUrl` |
| `auth.user-accepted-invite` | Invite accepted | `UserAcceptedCompanyInvite` | `userName`, `companyName`, `teamUrl` |
| `auth.user-created` | New org user | `UserCreated` | `userName`, `userEmail`, `userPhone` |
| `auth.mail-test` | SMTP test | `TestMail` / `SettingController::testMailConfig()` | _(globals only)_ |
| `registry.developer-verification` | Registry dev signup | `RegistryDeveloperAccountController` | `accountName`, `accountEmail`, `code` |

### FleetOps (13)

| Template key | Trigger | Generator class | Required variables |
|--------------|---------|-----------------|-------------------|
| `fleetops.work-order-dispatched` | Send work order email | `WorkOrderDispatched` | `emailSubject`, `workOrderPublicId`, `assigneeName?`, `workOrderStatus`, `workOrderPriority`, `targetName?`, `dueAt?`, `estimatedCost?`, `approvedBudget?`, `instructions?` |
| `fleetops.customer-credentials` | Customer password reset | `CustomerCredentialsMail` | `customerName`, `userEmail`, `plaintextPassword`, `companyName`, `customerPortalUrl?`, `currentHour` |
| `fleetops.maintenance-reminder` | Scheduled command | `MaintenanceScheduleReminder` | `scheduleName`, `targetName?`, `assigneeName?`, `reminderMessage`, `scheduleType`, `dueDate`, `intervalLabel`, `priority`, `instructions?` |
| `fleetops.order-assigned` | Order assigned listener | `OrderAssigned` | `title`, `message`, `isScheduled?`, `scheduledAt?`, `actionUrl`, `actionLabel` |
| `fleetops.order-dispatched` | Order dispatched | `OrderDispatched` | `title`, `message`, `actionUrl`, `actionLabel` |
| `fleetops.order-canceled` | Order canceled | `OrderCanceled` | `title`, `message`, `reason`, `actionUrl`, `actionLabel` |
| `fleetops.order-completed` | Order completed | `OrderCompleted` | `title`, `message`, `actionUrl`, `actionLabel` |
| `fleetops.order-failed` | Order failed | `OrderFailed` | `title`, `message`, `reason`, `actionUrl`, `actionLabel` |
| `fleetops.order-dispatch-failed` | Dispatch failed | `OrderDispatchFailed` | `title`, `message`, `actionUrl`, `actionLabel` |
| `fleetops.driver-shift-changed` | Shift create/update | `DriverShiftChanged` | `title`, `message`, `notes?`, `scheduleUrl` |
| `fleetops.driver-arrived-geofence` | Geofence entered | `DriverArrivedAtGeofence` | `orderId`, `geofenceName`, `trackUrl` |
| `fleetops.waypoint-completed` | _(class only, no trigger)_ | `WaypointCompleted` | `title`, `message`, `actionUrl`, `actionLabel` |
| `fleetops.order-split` | _(stub)_ | `OrderSplit` | _(none)_ |

### Storefront (13)

| Template key | Trigger | Generator class | Required variables |
|--------------|---------|-----------------|-------------------|
| `storefront.network-invite` | Network invite | `StorefrontNetworkInvite` | `networkName`, `senderName`, `inviteUrl` |
| `storefront.verification-create-customer` | Customer signup OTP | `VerificationMail` | `storeName`, `code` |
| `storefront.verification-account-closure` | Account closure OTP | `VerificationMail` | `storeName`, `code` |
| `storefront.order-created` | New order alert | `StorefrontOrderCreated` | `storeName`, `orderMethod`, `customerName`, `customerPhone`, `items`, `deliveryAddress?`, `deliveryFee?`, `deliveryTip?`, `tip?`, `subtotal`, `total` |
| `storefront.order-accepted` | Order accepted | `StorefrontOrderAccepted` | `storeName` |
| `storefront.order-preparing` | CLI / manual | `StorefrontOrderPreparing` | `storeName` |
| `storefront.order-ready-for-pickup` | Order dispatched (pickup) | `StorefrontOrderReadyForPickup` | `storeName` |
| `storefront.order-driver-assigned` | Driver assigned | `StorefrontOrderDriverAssigned` | `storeName`, `driverName?` |
| `storefront.order-enroute` | Order started | `StorefrontOrderEnroute` | `storeName` |
| `storefront.order-nearby` | Nearby command | `StorefrontOrderNearby` | `storeName` |
| `storefront.order-completed` | Order completed | `StorefrontOrderCompleted` | `storeName` |
| `storefront.order-canceled` | CLI / manual | `StorefrontOrderCanceled` | `storeName` |

### Global variables (injected automatically)

- `appName`, `year`, `logoUrl`, `consoleUrl`

## Migration steps

1. **Run migration:** `php artisan migrate` (creates `email_templates`).
2. **Deploy packages** with new `.vm` files and refactored PHP classes.
3. **Verify rendering:** `php artisan test --filter=VelocityEngineTest` in `core-api`.
4. **Smoke-test critical flows:** onboarding verification, password reset, work order email, order assigned notification.
5. **Optional:** seed `variables_schema` rows for admin UI (future phase).
6. **Deprecate legacy Blade mail views** (kept for one release; remove after validation):
   - `packages/core-api/views/mail/*.blade.php`
   - `packages/fleetops/server/resources/views/mail/*.blade.php`

## Velocity syntax supported

- References: `$variable`, `$!variable`, `${variable}`, `$object.property`
- Directives: `#if`, `#elseif`, `#else`, `#end`, `#foreach`, `#set`, `#parse`
- Comments: `## line comment`
- HTML escaping by default; use `raw_variables` in registry (e.g. `contentOverride`) for trusted HTML fragments

## Backward compatibility

- `VerificationCode::generateEmailVerificationFor()` still accepts `subject`, `content`, and `messageCallback` options; these map to `subjectOverride` and `contentOverride` template variables.
- Notification channels (`mail`, `database`, `broadcast`, FCM, APN) are unchanged—only `toMail()` content source changed.
- Company `notification_settings` routing is unchanged.

## Adding a new email type

1. Add `.subject.vm` and `.body.vm` under the appropriate package `email-templates/` folder.
2. Register key in `EmailTemplateRegistry` or package registry class.
3. Use `velocityMail()` or `RendersVelocityMailable` in the notification/mailable.
4. Document variables in this file and optionally in `variables_schema`.
