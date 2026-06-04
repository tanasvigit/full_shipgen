# Ember Admin Panel: Core Pages Only

This document lists only the built-in Ember admin pages defined directly in the core router/templates.

Sources used:

- `console/router.map.js`
- `console/app/templates/console/admin.hbs`
- `console/app/routes/console/admin/**`
- `console/app/templates/console/admin/**`

## Scope

Included:

- built-in core admin pages
- built-in subpages
- built-in config pages

Excluded:

- runtime extension-driven admin pages
- extension menu panels like `Fleet-Ops Config`
- extension menu panels like `Extensions Registry`
- dynamic virtual admin entries registered through `menuService`

## Total Core Admin Pages

There are `15` concrete built-in admin pages in the Ember codebase.

Breakdown:

1. `11` built-in sidebar-visible pages
2. `2` built-in nested overlay subpages
3. `2` built-in URL-defined config pages not shown in the default sidebar

## Core Route Tree

```text
console.admin
├── console.admin.index                         -> /admin
├── console.admin.organizations.index           -> /admin/organizations
├── console.admin.organizations.index.users     -> /admin/organizations/:public_id/users
├── console.admin.branding                      -> /admin/branding
├── console.admin.two-fa-settings               -> /admin/two-fa-settings
├── console.admin.schedule-monitor              -> /admin/schedule-monitor
├── console.admin.schedule-monitor.logs         -> /admin/schedule-monitor/:id/logs
├── console.admin.config.services               -> /admin/config/services
├── console.admin.config.mail                   -> /admin/config/mail
├── console.admin.config.filesystem             -> /admin/config/filesystem
├── console.admin.config.queue                  -> /admin/config/queue
├── console.admin.config.socket                 -> /admin/config/socket
├── console.admin.config.notification-channels  -> /admin/config/push-notifications
├── console.admin.config.database               -> /admin/config/database
└── console.admin.config.cache                  -> /admin/config/cache
```

## Built-In Sidebar Pages

These are rendered directly by `console/app/templates/console/admin.hbs`.

### 1. Overview

- URL: `/admin`
- Route: `console.admin.index`
- Files:
  - `console/app/routes/console/admin/index.js`
  - `console/app/templates/console/admin/index.hbs`
- Purpose:
  - main admin landing page
  - fetches `settings/overview`
  - shows top-level admin metrics

### UI

- `Overview` section header
- `Total Users`
- `Total Organizations`
- `Total Transactions`

### 2. Organizations

- URL: `/admin/organizations`
- Route: `console.admin.organizations.index`
- Files:
  - `console/app/routes/console/admin/organizations/index.js`
  - `console/app/templates/console/admin/organizations/index.hbs`
- Purpose:
  - organization/company listing in admin mode

### Query params

- `page`
- `query`
- `sort`
- `limit`
- `name`
- `country`

### UI

- section header
- search
- export button
- paginated organizations table

### 3. Branding

- URL: `/admin/branding`
- Route: `console.admin.branding`
- Files:
  - `console/app/routes/console/admin/branding.js`
  - `console/app/templates/console/admin/branding.hbs`
- Purpose:
  - brand customization
  - loads brand record `1`

### UI

- icon upload/reset
- logo upload/reset
- default theme selection

### 4. 2FA Config

- URL: `/admin/two-fa-settings`
- Route: `console.admin.two-fa-settings`
- Files:
  - `console/app/routes/console/admin/two-fa-settings.js`
  - `console/app/templates/console/admin/two-fa-settings.hbs`
- Purpose:
  - system/organization 2FA administration

### UI

- `2FA Config` header
- config content panel

### 5. Schedule Monitor

- URL: `/admin/schedule-monitor`
- Route: `console.admin.schedule-monitor`
- Files:
  - `console/app/routes/console/admin/schedule-monitor.js`
  - `console/app/templates/console/admin/schedule-monitor.hbs`
- Purpose:
  - operational schedule task monitoring
  - fetches `schedule-monitor/tasks`

### UI

- table columns:
  - name
  - type
  - timezone
  - last started
  - last finished
  - last failure

### 6. Services

- URL: `/admin/config/services`
- Route: `console.admin.config.services`
- Files:
  - `console/app/routes/console/admin/config/services.js`
  - `console/app/templates/console/admin/config/services.hbs`
- Purpose:
  - services configuration

### UI

- header: `Services Configuration`
- renders `<Configure::Services />`

### 7. Mail

- URL: `/admin/config/mail`
- Route: `console.admin.config.mail`
- Files:
  - `console/app/routes/console/admin/config/mail.js`
  - `console/app/templates/console/admin/config/mail.hbs`
- Purpose:
  - mail configuration

### 8. Filesystem

- URL: `/admin/config/filesystem`
- Route: `console.admin.config.filesystem`
- Files:
  - `console/app/routes/console/admin/config/filesystem.js`
  - `console/app/templates/console/admin/config/filesystem.hbs`
- Purpose:
  - filesystem configuration

### 9. Queue

- URL: `/admin/config/queue`
- Route: `console.admin.config.queue`
- Files:
  - `console/app/routes/console/admin/config/queue.js`
  - `console/app/templates/console/admin/config/queue.hbs`
- Purpose:
  - queue configuration

### 10. Socket

- URL: `/admin/config/socket`
- Route: `console.admin.config.socket`
- Files:
  - `console/app/routes/console/admin/config/socket.js`
  - `console/app/templates/console/admin/config/socket.hbs`
- Purpose:
  - socket configuration

### 11. Push Notifications

- URL: `/admin/config/push-notifications`
- Route: `console.admin.config.notification-channels`
- Files:
  - `console/app/routes/console/admin/config/notification-channels.js`
  - `console/app/templates/console/admin/config/notification-channels.hbs`
- Purpose:
  - push notification / notification channel configuration

## Built-In Nested Subpages

These are still core pages, but they behave like overlays rather than full normal pages.

### 12. Organization Users

- URL: `/admin/organizations/:public_id/users`
- Route: `console.admin.organizations.index.users`
- Files:
  - `console/app/routes/console/admin/organizations/index/users.js`
  - `console/app/templates/console/admin/organizations/index/users.hbs`
- Purpose:
  - user listing for a selected organization

### Behavior

- right-side overlay
- resizable
- includes nested search
- includes nested pagination

### Query params

- `nestedPage`
- `nestedLimit`
- `nestedSort`
- `nestedQuery`

### 13. Schedule Monitor Logs

- URL: `/admin/schedule-monitor/:id/logs`
- Route: `console.admin.schedule-monitor.logs`
- Files:
  - `console/app/routes/console/admin/schedule-monitor/logs.js`
  - `console/app/templates/console/admin/schedule-monitor/logs.hbs`
- Purpose:
  - task-specific log inspection

### Behavior

- right-side overlay
- resizable
- fetches:
  - task detail
  - last task logs

## Built-In URL-Only / Non-Sidebar Pages

These routes exist in the core router, but they are not linked from the default built-in admin sidebar.

### 14. Database Configuration

- URL: `/admin/config/database`
- Route: `console.admin.config.database`
- Files:
  - `console/app/routes/console/admin/config/database.js`
  - `console/app/templates/console/admin/config/database.hbs`
- Purpose:
  - database config page

### UI

- header: `Database Configuration`
- renders `<Configure::Database />`

### 15. Cache

- URL: `/admin/config/cache`
- Route: `console.admin.config.cache`
- Files:
  - `console/app/routes/console/admin/config/cache.js`
  - `console/app/templates/console/admin/config/cache.hbs`
- Purpose:
  - cache config route shell

### Important note

This route exists in the core code, but its current template is effectively a placeholder shell with:

- page title
- `{{outlet}}`

## Not Included In This Document

The following are intentionally excluded because they are not core statically declared admin pages:

- `console.admin.virtual`
- runtime `adminMenuItems`
- runtime `adminMenuPanels`
- screenshot-specific extension pages like:
  - `Navigator App`
  - `Registry Config`
  - `Awaiting Review`
  - `Pending Publish`

