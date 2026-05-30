# Ember Admin Panel Documentation

This document maps the Ember admin panel at `http://localhost:4200/admin` using the source in:

- `console/router.map.js`
- `console/app/templates/console/admin.hbs`
- `console/app/routes/console/admin/**`
- `console/app/templates/console/admin/**`

It covers:

- built-in admin pages
- subpages and nested overlays
- sidebar structure
- dynamic extension-driven admin pages
- route behavior and page purpose

## Summary

### Built-in core admin pages

There are `15` concrete built-in admin pages/routes in the Ember codebase.

They break down into:

1. `11` sidebar-visible built-in admin entries
2. `2` nested overlay subpages
3. `2` URL-defined config pages that exist in routing/templates but are not linked from the default sidebar

### Structural helper routes

There are also `2` structural admin routes that are important architecturally:

1. `console.admin.config`
2. `console.admin.virtual`

These are not direct business pages in the normal sidebar, but they are critical to how the admin panel is composed.

### Extension-driven pages

The live admin UI can include additional pages registered at runtime through the menu service. In your screenshot, these appear as:

- `Fleet-Ops Config`
  - `Navigator App`
- `Extensions Registry`
  - `Registry Config`
  - `Awaiting Review`
  - `Pending Publish`

These are not statically declared in `console/router.map.js`. They are injected dynamically.

## Core Route Tree

From `console/router.map.js`, the admin route tree is:

```text
console.admin
├── console.admin.index                         -> /admin
├── console.admin.config                        -> /admin/config
│   ├── console.admin.config.database           -> /admin/config/database
│   ├── console.admin.config.cache              -> /admin/config/cache
│   ├── console.admin.config.filesystem         -> /admin/config/filesystem
│   ├── console.admin.config.mail               -> /admin/config/mail
│   ├── console.admin.config.notification-channels
│   │                                         -> /admin/config/push-notifications
│   ├── console.admin.config.queue              -> /admin/config/queue
│   ├── console.admin.config.services           -> /admin/config/services
│   └── console.admin.config.socket             -> /admin/config/socket
├── console.admin.branding                      -> /admin/branding
├── console.admin.two-fa-settings               -> /admin/two-fa-settings
├── console.admin.virtual                       -> /admin/:slug
├── console.admin.organizations                 -> /admin/organizations
│   └── console.admin.organizations.index       -> /admin/organizations
│       └── console.admin.organizations.index.users
│                                              -> /admin/organizations/:public_id/users
└── console.admin.schedule-monitor              -> /admin/schedule-monitor
    └── console.admin.schedule-monitor.logs     -> /admin/schedule-monitor/:id/logs
```

## Sidebar Composition

The admin sidebar is assembled in `console/app/templates/console/admin.hbs`.

### Built-in root sidebar items

These are always rendered directly:

1. `Overview`
2. `Organizations`
3. `Branding`
4. `2FA Config`
5. `Schedule Monitor`

### Runtime-injected admin items

After the core items, the template renders:

- `this.menuService.adminMenuItems`
- `this.menuService.adminMenuPanels`

These are routed through `console.admin.virtual`.

This is how extension/admin plugin pages appear in the sidebar without being hardcoded in the main router.

### Built-in System Config panel

The admin sidebar then renders a fixed `System Config` panel with:

1. `Services`
2. `Mail`
3. `Filesystem`
4. `Queue`
5. `Socket`
6. `Push Notifications`

## Detailed Page Inventory

## 1. `/admin`

- Route: `console.admin.index`
- Files:
  - `console/app/routes/console/admin/index.js`
  - `console/app/templates/console/admin/index.hbs`
- Purpose:
  - main admin overview page
  - fetches `settings/overview`
  - renders admin stat widgets

### UI shown

- section header: `Overview`
- stat widgets:
  - `Total Users`
  - `Total Organizations`
  - `Total Transactions`

## 2. `/admin/organizations`

- Route: `console.admin.organizations.index`
- Files:
  - `console/app/routes/console/admin/organizations/index.js`
  - `console/app/templates/console/admin/organizations/index.hbs`
- Purpose:
  - organization/company listing in admin view
  - queries Ember Data `company` records with `view: 'admin'`

### Query params supported

- `page`
- `query`
- `sort`
- `limit`
- `name`
- `country`

### UI shown

- section header: `Organizations`
- search
- export action
- paginated table of organizations

## 3. `/admin/organizations/:public_id/users`

- Route: `console.admin.organizations.index.users`
- Files:
  - `console/app/routes/console/admin/organizations/index/users.js`
  - `console/app/templates/console/admin/organizations/index/users.hbs`
- Purpose:
  - nested subpage for viewing the users of a selected organization
  - rendered as a right-side overlay, not a normal full page

### Query params supported

- `nestedPage`
- `nestedLimit`
- `nestedSort`
- `nestedQuery`

### UI shown

- overlay header: `<company name> - Users`
- nested search
- optional pagination
- table of users

## 4. `/admin/branding`

- Route: `console.admin.branding`
- Files:
  - `console/app/routes/console/admin/branding.js`
  - `console/app/templates/console/admin/branding.hbs`
- Purpose:
  - branding management for the console
  - loads brand record `1`

### UI shown

- branding page
- icon upload/reset
- logo upload/reset
- theme selection

## 5. `/admin/two-fa-settings`

- Route: `console.admin.two-fa-settings`
- Files:
  - `console/app/routes/console/admin/two-fa-settings.js`
  - `console/app/templates/console/admin/two-fa-settings.hbs`
- Purpose:
  - configure organization/system 2FA behavior in admin

### UI shown

- page title: `2FA Config`
- content panel for 2FA configuration

## 6. `/admin/schedule-monitor`

- Route: `console.admin.schedule-monitor`
- Files:
  - `console/app/routes/console/admin/schedule-monitor.js`
  - `console/app/templates/console/admin/schedule-monitor.hbs`
- Purpose:
  - operational monitoring page for scheduled tasks
  - fetches `schedule-monitor/tasks`

### UI shown

- table of tasks with columns:
  - `Name`
  - `Type`
  - `Timezone`
  - `Last Started`
  - `Last Finished`
  - `Last Failure`

## 7. `/admin/schedule-monitor/:id/logs`

- Route: `console.admin.schedule-monitor.logs`
- Files:
  - `console/app/routes/console/admin/schedule-monitor/logs.js`
  - `console/app/templates/console/admin/schedule-monitor/logs.hbs`
- Purpose:
  - detailed task log subpage for a specific scheduled task
  - opens as a right-side overlay
  - fetches task record and then task logs

### UI shown

- overlay header: `Task Logs For: <task name>`
- refresh button
- last 20 logs
- each log shows:
  - date
  - memory
  - runtime
  - output

## 8. `/admin/config/services`

- Route: `console.admin.config.services`
- Files:
  - `console/app/routes/console/admin/config/services.js`
  - `console/app/templates/console/admin/config/services.hbs`
- Purpose:
  - system services configuration

### UI shown

- header: `Services Configuration`
- renders `<Configure::Services />`

## 9. `/admin/config/mail`

- Route: `console.admin.config.mail`
- Files:
  - `console/app/routes/console/admin/config/mail.js`
  - `console/app/templates/console/admin/config/mail.hbs`
- Purpose:
  - mail configuration

### UI shown

- header: `Mail Configuration`
- renders `<Configure::Mail />`

## 10. `/admin/config/filesystem`

- Route: `console.admin.config.filesystem`
- Files:
  - `console/app/routes/console/admin/config/filesystem.js`
  - `console/app/templates/console/admin/config/filesystem.hbs`
- Purpose:
  - filesystem configuration

### UI shown

- header: `Filesystem Configuration`
- renders `<Configure::Filesystem />`

## 11. `/admin/config/queue`

- Route: `console.admin.config.queue`
- Files:
  - `console/app/routes/console/admin/config/queue.js`
  - `console/app/templates/console/admin/config/queue.hbs`
- Purpose:
  - queue configuration

### UI shown

- header: `Queue Configuration`
- renders `<Configure::Queue />`

## 12. `/admin/config/socket`

- Route: `console.admin.config.socket`
- Files:
  - `console/app/routes/console/admin/config/socket.js`
  - `console/app/templates/console/admin/config/socket.hbs`
- Purpose:
  - socket configuration

### UI shown

- header: `Socket Configuration`
- renders `<Configure::Socket />`

## 13. `/admin/config/push-notifications`

- Route: `console.admin.config.notification-channels`
- Files:
  - `console/app/routes/console/admin/config/notification-channels.js`
  - `console/app/templates/console/admin/config/notification-channels.hbs`
- Purpose:
  - push notification / notification channel configuration

### UI shown

- header: `Push Notifications Configuration`
- renders `<Configure::NotificationChannels />`

## 14. `/admin/config/database`

- Route: `console.admin.config.database`
- Files:
  - `console/app/routes/console/admin/config/database.js`
  - `console/app/templates/console/admin/config/database.hbs`
- Purpose:
  - database configuration page

### Important note

This route exists in the router and template layer, but it is not included in the default admin sidebar panel shown in `console/app/templates/console/admin.hbs`.

### UI shown

- header: `Database Configuration`
- renders `<Configure::Database />`

## 15. `/admin/config/cache`

- Route: `console.admin.config.cache`
- Files:
  - `console/app/routes/console/admin/config/cache.js`
  - `console/app/templates/console/admin/config/cache.hbs`
- Purpose:
  - cache config route shell

### Important note

This route exists, but unlike the other config pages its current template is essentially only:

- page title
- `{{outlet}}`

So this is more of a placeholder/container route in the current codebase.

## Structural Admin Routes

## A. `/admin/config`

- Route: `console.admin.config`
- Files:
  - `console/app/routes/console/admin/config.js`
  - `console/app/templates/console/admin/config.hbs`
- Purpose:
  - grouping route for config subpages
  - not a standalone admin content page in practice

### UI shown

- page title: `System Configuration`
- `{{outlet}}`

## B. `/admin/:slug`

- Route: `console.admin.virtual`
- Files:
  - `console/app/routes/console/admin/virtual.js`
  - `console/app/templates/console/admin/virtual.hbs`
- Purpose:
  - dynamic admin page host
  - used for extension/plugin/admin runtime menu pages

### How it works

The route calls:

- `lookupMenuItem('console:admin', slug, view)`

Then `console/app/templates/console/admin/virtual.hbs` lazy-renders:

- `@model.component`

This is the mechanism behind runtime-injected admin pages.

## Screenshot-Specific Dynamic Admin Entries

From your screenshot of `/admin`, these additional admin entries are present beyond the built-in static sidebar items:

## Fleet-Ops Config

Panel title observed:

- `Fleet-Ops Config`

Visible subpage:

1. `Navigator App`

## Extensions Registry

Panel title observed:

- `Extensions Registry`

Visible subpages:

1. `Registry Config`
2. `Awaiting Review`
3. `Pending Publish`

## Why these do not appear in the static router

These are injected from runtime menu registration through:

- `this.menuService.adminMenuItems`
- `this.menuService.adminMenuPanels`

and rendered through:

- `console.admin.virtual`

So their exact set can vary depending on:

- installed extensions
- enabled modules
- runtime registry/menu registration

## Final Count

### Core built-in admin pages

`15`

### Built-in sidebar-visible entries

`11`

### Nested built-in overlay subpages

`2`

### Built-in URL-only/non-sidebar routes

`2`

### Structural admin helper routes

`2`

### Extension-driven pages visible in your screenshot

`4`

## Practical interpretation

If you are documenting the admin panel as a user-visible system from your current running environment, the visible admin menu in the screenshot contains:

1. Overview
2. Organizations
3. Branding
4. 2FA Config
5. Schedule Monitor
6. Navigator App
7. Registry Config
8. Awaiting Review
9. Pending Publish
10. Services
11. Mail
12. Filesystem
13. Queue
14. Socket
15. Push Notifications

That is `15` visible sidebar entries in the current screenshot.

If you are documenting the core Ember code only, the built-in admin panel defines `15` concrete admin pages plus the structural dynamic host routes.

