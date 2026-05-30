# Admin Route Tree Reference

## Core Ember Router Tree

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
├── console.admin.organizations
│   └── console.admin.organizations.index       -> /admin/organizations
│       └── console.admin.organizations.index.users
│                                              -> /admin/organizations/:public_id/users
└── console.admin.schedule-monitor              -> /admin/schedule-monitor
    └── console.admin.schedule-monitor.logs     -> /admin/schedule-monitor/:id/logs
```

## Built-In Sidebar Tree

```text
Admin
├── Overview
├── Organizations
├── Branding
├── 2FA Config
├── Schedule Monitor
└── System Config
    ├── Services
    ├── Mail
    ├── Filesystem
    ├── Queue
    ├── Socket
    └── Push Notifications
```

## Built-In Concrete Pages

```text
/admin
/admin/organizations
/admin/organizations/:public_id/users
/admin/branding
/admin/two-fa-settings
/admin/schedule-monitor
/admin/schedule-monitor/:id/logs
/admin/config/services
/admin/config/mail
/admin/config/filesystem
/admin/config/queue
/admin/config/socket
/admin/config/push-notifications
/admin/config/database
/admin/config/cache
```

## Runtime / Extension-Driven Entries Seen In Screenshot

```text
Admin
├── Fleet-Ops Config
│   └── Navigator App
├── Extensions Registry
│   ├── Registry Config
│   ├── Awaiting Review
│   └── Pending Publish
└── console.admin.virtual
    └── /admin/:slug
```

## React Admin Route Tree

```text
/admin
/admin/branding
/admin/notifications
/admin/two-fa-settings
/admin/config
/admin/config/database
/admin/config/cache
/admin/config/filesystem
/admin/config/mail
/admin/config/push-notifications
/admin/config/queue
/admin/config/services
/admin/config/socket
/admin/organizations
/admin/organizations/:public_id/users
/admin/schedule-monitor
/admin/schedule-monitor/:id/logs
/admin/:slug
```
