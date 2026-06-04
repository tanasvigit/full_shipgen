# React Migration Plan For The Admin Panel

This document outlines a practical React migration plan for the Ember admin panel based on:

- Ember admin structure in `console/`
- current React implementation in `react-console/`
- current React routes in `react-console/src/App.tsx`

The goal is to migrate the admin panel with high parity while preserving the architecture already built in React:

- enterprise shell
- smart navigation
- overlay system
- dynamic virtual routing
- sidebar host
- modular page architecture

## Current React Status

The React app already includes a significant portion of the admin route surface.

### Already routed in React

From `react-console/src/App.tsx`, the following admin routes already exist:

1. `/admin`
2. `/admin/branding`
3. `/admin/notifications`
4. `/admin/two-fa-settings`
5. `/admin/config`
6. `/admin/config/database`
7. `/admin/config/cache`
8. `/admin/config/filesystem`
9. `/admin/config/mail`
10. `/admin/config/push-notifications`
11. `/admin/config/queue`
12. `/admin/config/services`
13. `/admin/config/socket`
14. `/admin/organizations`
15. `/admin/organizations/:public_id/users`
16. `/admin/schedule-monitor`
17. `/admin/schedule-monitor/:id/logs`
18. `/admin/:slug`

### Important observation

Route coverage is relatively strong already.

However, UI parity is still incomplete because the Ember admin experience depends on more than route declarations:

1. admin-specific sidebar composition
2. admin section density and layout
3. extension-driven sidebar panels
4. dynamic admin page hosting behavior
5. overlay-style subpages

## Major Gaps Between Ember And Current React

## 1. Admin sidebar parity is not yet matched

Current React `SidebarHost.tsx` only handles:

- `profile`
- `settings`
- `customization`

It does **not** yet provide an Ember-like admin sidebar containing:

- Overview
- Organizations
- Branding
- 2FA Config
- Schedule Monitor
- System Config group
- runtime extension admin items/panels

### Impact

Even with routes implemented, the React admin experience does not yet feel like the Ember admin panel because the main navigation model is incomplete.

## 2. Dynamic admin menu registration is not yet at Ember parity

In Ember:

- `console/app/templates/console/admin.hbs` renders:
  - `menuService.adminMenuItems`
  - `menuService.adminMenuPanels`
- dynamic admin pages route through `console.admin.virtual`

In React:

- there is a `VirtualPage`
- but there is no admin-specific menu registry/panel rendering equivalent yet inside the sidebar

### Impact

Extension-driven admin pages like:

- `Navigator App`
- `Registry Config`
- `Awaiting Review`
- `Pending Publish`

cannot yet be represented with the same UX model as Ember.

## 3. Overlay subpage behavior needs explicit parity work

In Ember, subpages like:

- organization users
- schedule logs

open as enterprise overlays/drawers with dedicated header/body behavior.

In React, these routes exist, but parity depends on whether the page implementation matches:

- right-side overlay behavior
- no-backdrop or lightweight-backdrop behavior
- resize affordances
- header actions

## 4. React has at least one extra route not present in Ember core admin

React currently includes:

- `/admin/notifications`

This does not appear in the core Ember admin route tree documented from `console/router.map.js`.

### Impact

This is not necessarily wrong, but it should be categorized as:

- React-specific addition
- or future extension/admin feature

so it does not get mistaken for a core parity requirement.

## Migration Goal

The target should be:

1. preserve the strong React route base already present
2. add Ember-like admin shell behavior
3. separate core admin navigation from extension-driven admin navigation
4. keep dynamic virtual admin page support
5. migrate page implementations in parity order rather than route order only

## Recommended Migration Strategy

## Phase 1. Admin Shell Parity

### Goal

Make `/admin` feel like Ember before focusing on individual page internals.

### Work

1. Extend `SidebarHost.tsx` or add an admin sidebar module so `/admin/**` shows:
   - Overview
   - Organizations
   - Branding
   - 2FA Config
   - Schedule Monitor
2. Add fixed `System Config` panel:
   - Services
   - Mail
   - Filesystem
   - Queue
   - Socket
   - Push Notifications
3. Match Ember sidebar density and section grouping
4. Keep the current shell architecture, do not replace it

### Why first

This yields the biggest parity gain with the least risk.

## Phase 2. Core Page Surface Parity

### Goal

Bring the built-in admin pages visually and behaviorally closer to Ember.

### Priority pages

1. Overview
2. Organizations
3. Branding
4. 2FA Config
5. Schedule Monitor
6. System Config pages

### Work

For each page:

1. match page header behavior
2. match content density
3. match table/card spacing
4. match loading states
5. match overlay interactions where applicable

## Phase 3. Nested Overlay Parity

### Goal

Match Ember’s right-side admin subpage flows.

### Pages

1. `/admin/organizations/:public_id/users`
2. `/admin/schedule-monitor/:id/logs`

### Work

1. standardize overlay width
2. standardize header layout
3. align close actions
4. support resize-ready structure
5. ensure these feel like admin detail views, not standalone unrelated pages

## Phase 4. Dynamic Admin Virtual Route Parity

### Goal

Replicate the Ember admin extension-host pattern cleanly in React.

### Work

1. create an admin menu registry layer in React
2. distinguish:
   - core admin routes
   - extension-driven admin items
   - extension-driven admin panels
3. drive `/admin/:slug` from registry metadata rather than a generic placeholder feel
4. connect admin sidebar rendering to the same registry

### Existing foundation to reuse

React already has:

- `VirtualPage`
- extension/manifest concepts
- smart navigation ideas
- registry-driven infrastructure

So this should be built as an extension of the current system, not a rewrite.

## Phase 5. Extension Panel Parity

### Goal

Support Ember-style runtime admin menu panels such as:

- `Fleet-Ops Config`
- `Extensions Registry`

### Work

1. model grouped admin panels in React
2. render them in the admin sidebar beneath core pages
3. allow each item to route through:
   - explicit route
   - or admin virtual route
4. support future dynamic registration

## Page Mapping: Ember To React

| Ember Page | Ember Route | React Route Exists? | Migration Status |
|---|---|---:|---|
| Overview | `console.admin.index` | Yes | Route exists, shell/sidebar parity still needed |
| Organizations | `console.admin.organizations.index` | Yes | Route exists, needs sidebar parity and page parity review |
| Organization Users | `console.admin.organizations.index.users` | Yes | Route exists, overlay parity needs review |
| Branding | `console.admin.branding` | Yes | Route exists |
| 2FA Config | `console.admin.two-fa-settings` | Yes | Route exists |
| Schedule Monitor | `console.admin.schedule-monitor` | Yes | Route exists |
| Schedule Logs | `console.admin.schedule-monitor.logs` | Yes | Route exists |
| Services | `console.admin.config.services` | Yes | Route exists |
| Mail | `console.admin.config.mail` | Yes | Route exists |
| Filesystem | `console.admin.config.filesystem` | Yes | Route exists |
| Queue | `console.admin.config.queue` | Yes | Route exists |
| Socket | `console.admin.config.socket` | Yes | Route exists |
| Push Notifications | `console.admin.config.notification-channels` | Yes | Route exists |
| Database | `console.admin.config.database` | Yes | Route exists |
| Cache | `console.admin.config.cache` | Yes | Route exists |
| Dynamic admin page | `console.admin.virtual` | Yes | Foundation exists, parity incomplete |

## Recommended Technical Shape In React

## Keep

Keep the existing React architecture:

- `App.tsx` route declarations
- shell layout
- overlay primitives
- registry-style patterns
- `VirtualPage`

## Add

Add:

1. `adminRegistry.ts`
   - core routes
   - extension items
   - extension panels
2. admin-aware sidebar section rendering
3. admin virtual page adapter
4. admin route metadata for:
   - title
   - panel
   - route
   - render mode
   - overlay/full-page behavior

## Avoid

Do not:

- rewrite the whole shell
- create a second parallel admin layout system
- hardcode extension-driven admin panels in JSX

## Immediate Next Best Step

If the next implementation task is admin-panel parity, the best next step is:

### Step 1

Implement an Ember-like admin sidebar in React.

This should include:

- built-in root admin items
- built-in `System Config` panel
- placeholder support for dynamic extension panels

### Why this first

Because most of the React route surface already exists, but the admin experience still will not feel correct until the left-side admin navigation model matches Ember.

## Final Recommendation

Treat the React admin migration as:

1. **route coverage**: mostly present already
2. **shell/navigation parity**: still the biggest missing piece
3. **page implementation parity**: follow after sidebar/admin-shell parity
4. **extension-driven admin support**: build on top of the existing virtual page architecture

In short:

- React is already partway through the admin migration
- the next high-value milestone is not adding more routes
- it is making the admin shell and dynamic admin navigation behave like Ember

