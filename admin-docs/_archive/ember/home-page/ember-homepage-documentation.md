# Ember Homepage Documentation

This document maps the authenticated Ember homepage at `http://localhost:4200/` using the source in:

- `D:/fleetbase/console`
- `D:/fleetbase/packages`

The goal is to document everything that makes up the Ember homepage experience:

- homepage routes
- shell structure
- visible sections on the page
- all header features
- dashboard behavior
- smart navigation and overflow
- menu-driven pages and subpages reachable from home
- runtime and extension-driven parts of the homepage

## 1. Homepage Route Chain

The authenticated homepage is not a single isolated route. It is the route chain:

1. `application`
2. `console`
3. `console.home`

Main router file:

- `D:/fleetbase/console/app/router.js`

Relevant route definitions:

- `console` is mounted at `/`
- `console.home` is also mounted at `/`

So in practice:

- the `console` route is the authenticated shell
- the `console.home` route is the actual homepage leaf

Key route files:

- `D:/fleetbase/console/app/routes/application.js`
- `D:/fleetbase/console/app/routes/console.js`
- `D:/fleetbase/console/app/routes/console/home.js`
- `D:/fleetbase/console/app/controllers/console/home.js`

Important note:

- `console/home.js` and `console/home` controller are minimal
- most homepage behavior comes from shared shell, header, dashboard, services, and extension registries

## 2. Console Shell Around The Homepage

The homepage lives inside the console shell defined in:

- `D:/fleetbase/console/app/templates/console.hbs`

The shell renders:

1. `Layout::Header`
2. `Layout::Main`
3. `Layout::Sidebar`
4. `Layout::Section`
5. `{{outlet}}`
6. `ResourceContextPanel`
7. `Layout::MobileNavbar`
8. `ChatContainer`
9. `ConsoleWormhole`
10. `ImpersonatorTray`
11. `RegistryYield @registry="@fleetbase/console"`

This means the homepage is not just the body inside `console/home.hbs`. It is the combination of:

- the shared header
- the shared main layout
- sidebar behavior
- mobile navigation
- chat windows
- wormholes/portals
- extension registry yield points

Core shell files:

- `D:/fleetbase/console/app/templates/console.hbs`
- `D:/fleetbase/console/app/routes/console.js`
- `D:/fleetbase/console/app/controllers/console.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/container.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/main.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/sidebar.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/sidebar.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/section.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/section/body.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/mobile-navbar.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/mobile-navbar.js`

## 3. Sidebar Behavior On Homepage

The console shell includes a sidebar host, but the homepage intentionally hides the sidebar.

Relevant controller:

- `D:/fleetbase/console/app/controllers/console.js`

Important tracked config:

- `hiddenSidebarRoutes = ['console.home', 'console.notifications', 'console.virtual']`

What that means:

- on the homepage, the left sidebar does not behave like the account/settings/admin sidebars
- the main top navigation responsibility shifts into the header smart navigation area

Homepage navigation therefore depends heavily on:

- header smart nav items
- overflow/extensions launcher
- organization menu
- user menu
- mobile navbar

## 4. Homepage Body

The homepage body template is:

- `D:/fleetbase/console/app/templates/console/home.hbs`

It renders:

1. `TwoFaEnforcementAlert`
2. `Dashboard @extension="core"`
3. `Spacer @height="300px"`
4. `<div id="console-home-wormhole" />`

So the visible home body is mainly:

- a possible 2FA enforcement message
- the core dashboard surface
- extra bottom spacing
- a wormhole target for optional injected home content

Relevant files:

- `D:/fleetbase/console/app/templates/console/home.hbs`
- `D:/fleetbase/console/app/components/two-fa-enforcement-alert.hbs`
- `D:/fleetbase/console/app/components/two-fa-enforcement-alert.js`

## 5. Homepage Layout Sections

From source, the homepage experience breaks into these visible sections:

1. Global console header
2. Hidden/managed sidebar shell
3. Main section body
4. 2FA alert area
5. Dashboard header row
6. Dashboard content grid
7. Optional widget picker overlay
8. Global chat windows
9. Global trays/dropdowns
10. Mobile bottom navigation

These sections do not all live in one file. They are assembled from:

- `console.hbs`
- `console/home.hbs`
- shared `Layout::*` components
- shared `Dashboard` components
- shared trays and overlays in `packages/ember-ui`

## 6. Header Overview

The global top header is implemented in:

- `D:/fleetbase/packages/ember-ui/addon/components/layout/header.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header.js`

The header is split into:

### Left side

1. Fleetbase logo
2. Sidebar toggle button on desktop
3. Smart navigation menu
4. `view-header-left-content-a` wormhole target
5. yielded custom content
6. `view-header-left-content-b` wormhole target

### Right side

1. Loading indicator
2. `view-header-actions` wormhole target
3. Locale selector tray
4. Notifications tray
5. Chat tray
6. Organization dropdown
7. User/profile dropdown

Important note:

- dashboard selector and dashboard actions are **not** global header features
- they belong to the dashboard header inside the homepage body

## 7. Header Feature: Languages

Files:

- `D:/fleetbase/packages/ember-ui/addon/components/locale-selector-tray.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/locale-selector-tray.js`
- `D:/fleetbase/console/app/routes/application.js`

Behavior:

1. Header shows a globe/localization trigger.
2. Clicking opens a dropdown tray.
3. Tray lists locales from `intl.locales`.
4. Current locale comes from `intl.primaryLocale`.
5. Changing locale immediately calls `intl.setLocale(selectedLocale)`.
6. Locale is then persisted to backend with `POST users/locale`.
7. On mobile, the tray becomes full-width and anchored below the header.

State/services involved:

- `intl`
- `language`
- `fetch`
- `media`

Boot persistence source:

- `application.js` initializes locale from the current user option, typically `locale` with fallback `en-US`

## 8. Header Feature: Notifications

Files:

- `D:/fleetbase/packages/ember-ui/addon/components/notification-tray.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/notification-tray.js`
- `D:/fleetbase/console/app/routes/console/notifications.js`
- `D:/fleetbase/console/app/controllers/console/notifications.js`
- `D:/fleetbase/console/app/templates/console/notifications.hbs`

Tray behavior:

1. Header shows a notifications icon with unread count.
2. Component subscribes to:
   - `user.<currentUser.id>`
   - `company.<currentUser.companyId>`
3. It queries unread notifications from the store.
4. Incoming socket events fetch the notification record.
5. New unread notifications are inserted into the tray list.
6. A notification sound is played on receipt.
7. Clicking a notification marks it read and removes it from the tray.
8. Tray supports mobile full-width positioning.

Important internal behaviors:

- listens to universe events like:
  - `notifications.deleted`
  - `notifications.read`
  - `notifications.all_read`
- deduplicates notifications by `id`
- only keeps unread notifications in the tracked tray state

Full notifications page:

Reachable from the header tray, the dedicated page supports:

- full list view
- mark as read
- delete
- select all
- refresh
- pagination

So notifications have:

- a quick-access tray in the header
- a full route-backed page as a subpage from home

## 9. Header Feature: Chat

Files:

- `D:/fleetbase/packages/ember-ui/addon/components/chat-tray.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/chat-tray.js`
- `D:/fleetbase/packages/ember-ui/addon/components/chat-container.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/chat-container.js`

Supporting chat models:

- `D:/fleetbase/console/app/models/chat-channel.js`
- `D:/fleetbase/console/app/models/chat-message.js`
- `D:/fleetbase/console/app/models/chat-participant.js`
- `D:/fleetbase/console/app/models/chat-attachment.js`
- `D:/fleetbase/console/app/models/chat-receipt.js`
- `D:/fleetbase/console/app/serializers/chat-channel.js`

Header tray behavior:

1. Header shows chat icon and unread count.
2. On load, tray fetches chat channels through the `chat` service.
3. It listens to:
   - `user.<currentUser.id>`
   - `chat.<channel.public_id>` for every loaded channel
4. It reacts to:
   - channel created
   - channel deleted
   - participant added/removed
   - chat message created
   - receipt created
5. It supports:
   - open chat channel
   - start chat
   - remove/end chat
6. Incoming messages can play a sound.
7. On mobile, tray expands to full width.

Global chat windows:

- `ChatContainer` is mounted in `console.hbs`
- that means open chats are not only a dropdown list; they can also exist as persistent global chat UI after being opened from the homepage

## 10. Header Feature: Organization Menu

Primary menu-building logic:

- `D:/fleetbase/packages/ember-ui/addon/components/layout/header.js`

Trigger:

- company badge with first letter
- current company name

Menu content is assembled in `mergeOrganizationMenuItems()`:

### Top session block

- company name
- user email
- role badge

### Organization switcher block

For each organization in `currentUser.organizations`:

- menu entry for switching
- current organization is marked with check icon
- current organization entry is disabled

### Static entries

1. `Home`
2. `Organization settings`
3. `Create or join organizations`

### Conditional entry

If `@fleetbase/registry-bridge-engine` is loaded:

4. `Explore extensions`

### Runtime-registered entries

- `universe.organizationMenuItems`

### Footer-like entries

- app version
- `Admin` if `currentUser.isAdmin`
- `Logout`

Actions triggered from this menu include:

- switch organization
- open organization settings
- create or join organization flow
- open admin area
- logout

Related controller actions:

- `switchOrganization()`
- `createOrJoinOrg()`
- `invalidateSession()`

Controller file:

- `D:/fleetbase/console/app/controllers/console.js`

## 11. Header Feature: User / Profile Menu

Primary menu-building logic:

- `D:/fleetbase/packages/ember-ui/addon/components/layout/header.js`

Trigger:

- current user avatar

Menu content is assembled in `mergeUserMenuItems()`:

### Top session block

- user name
- role badge

### Static entries

1. `View Profile`
2. `Show keyboard shortcuts` (disabled)
3. `Changelog`

### Conditional entry

4. `Developers` if `@fleetbase/dev-engine` is loaded

### Support entries

5. `Join Discord Community`
6. `Help & Support`
7. `Documentation`

### Runtime-registered entries

- `universe.userMenuItems`

### Additional utility entry

- dark mode toggle component

### Final entry

- `Logout`

So this menu combines:

- profile/account access
- changelog access
- support/docs links
- optional developer tooling
- theme toggle
- logout

## 12. Header Feature: Smart Navigation

Files:

- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/item.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/item.js`

The homepage hides the sidebar, so smart nav becomes the main primary navigation surface.

Smart nav behavior:

1. Reads from `universe.headerMenuItems`.
2. Permission-filters items with `abilities.can('<id> see extension')`.
3. Supports extension shortcuts as first-class visible/searchable/pinnable items.
4. Shows at most `5` visible items by default.
5. Uses `ResizeObserver` to react to width changes.
6. Moves excess items into overflow.
7. Persists user-pinned order and visibility preferences.
8. Closes overflow after route transitions.

Persistence:

- preference key: `smart-nav-menu-prefs`
- stored through `currentUser.getOption()` / `setOption()`
- scoped per user

Visible result on homepage:

- top-level extension/app links in the header
- overflow for remaining extensions
- customization path for pinning and order

## 13. Header Feature: Extensions Overflow / App Launcher

Files:

- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/dropdown.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/dropdown.js`

Behavior:

1. Smart nav exposes a `More` button.
2. Clicking opens a dropdown rendered through wormhole into `application-root-wormhole`.
3. This dropdown functions as the extensions launcher.
4. It supports:
   - search
   - card grid layout
   - pinned/quick-pin actions
   - extension cards
   - shortcut cards
   - open customization

Important note:

- this is not just overflow hiding
- it acts as a permanent app launcher for header-registered extensions

## 14. Header Feature: Navigation Customizer

Files:

- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/customizer.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/customizer.js`

Behavior:

1. Opened from the smart nav gear icon or launcher footer.
2. Shows pinned items and full available extension list.
3. Allows pin/unpin.
4. Allows drag-and-drop reorder of pinned items.
5. Enforces the `maxVisible` cap.
6. Supports reset-to-default behavior.
7. Saves preferences back through the current user option store.

This is one of the most important homepage behaviors because it makes the homepage navigation user-customizable.

## 15. Header Wormholes / Injection Targets

Header and homepage wormhole targets:

- `view-header-left-content-a`
- `view-header-left-content-b`
- `view-header-actions`
- `console-home-wormhole`

Important known use:

- `ImpersonatorTray` uses `view-header-actions`

Home-local wormhole:

- `console-home-wormhole` exists in `console/home.hbs`

Meaning:

- parts of the homepage/header can be extended without directly changing the homepage template
- extension and runtime systems can inject extra UI into the shell

## 16. Dashboard System Overview

Homepage dashboard files:

- `D:/fleetbase/packages/ember-ui/addon/components/dashboard.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard.js`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard/create.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard/create.js`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard/widget-panel.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard/widget-panel.js`
- `D:/fleetbase/packages/ember-ui/addon/services/dashboard.js`

The dashboard is the main homepage body system.

It is responsible for:

1. loading dashboards
2. selecting current dashboard
3. creating dashboards
4. deleting dashboards
5. entering edit mode
6. entering add-widget mode
7. rendering widget grid
8. persisting widget positions

## 17. Dashboard Header Row

Rendered by `packages/ember-ui/addon/components/dashboard.hbs`.

The dashboard header contains:

### Left side

- current dashboard name as a heading

### Right side

1. dashboard selector dropdown
2. ellipsis actions dropdown
3. save button when editing is active

This is why dashboard selector/actions are homepage-local controls, not header-global controls.

## 18. Dashboard Selector

Behavior:

1. Dropdown lists all dashboards in `dashboard.dashboards`.
2. Each dashboard entry shows:
   - desktop icon
   - dashboard name
   - active checkmark when selected
3. Selecting a dashboard triggers dashboard switch logic.

Service behavior:

- if selected dashboard is the synthetic system dashboard, it resets backend default with `POST dashboards/reset-default`
- otherwise switches through `POST dashboards/switch`

## 19. Dashboard Actions Dropdown

Behavior:

The ellipsis dropdown includes:

1. `Create new dashboard`
2. `Edit layout`
3. `Add widgets`
4. `Delete dashboard`

Restrictions:

- `Edit layout`
- `Add widgets`
- `Delete dashboard`

are hidden for the synthetic system/default dashboard (`user_uuid === 'system'`)

When edit mode is active:

- save button appears in the dashboard header

## 20. Dashboard Creation / Deletion

Creation:

- handled through dashboard service
- creates Ember Data `dashboard` record
- saves it
- selects the newly created dashboard
- pushes it into tracked list

Deletion:

- destroys dashboard record
- reloads dashboards
- selects next available dashboard

Important file:

- `D:/fleetbase/packages/ember-ui/addon/services/dashboard.js`

## 21. Dashboard Edit Mode

Edit mode is controlled by:

- `dashboard.isEditingDashboard`

Behavior:

1. toggled via action menu
2. enables widget layout editing
3. save button appears while active
4. used together with GridStack layout editing

## 22. Add Widgets Flow

Add-widget mode is controlled by:

- `dashboard.isAddingWidget`

Behavior:

1. user opens add widgets from actions menu
2. `Dashboard::WidgetPanel` is rendered
3. widget panel is mounted through `EmberWormhole` into `application-root-wormhole`
4. user can browse/search widgets
5. widget is added to current dashboard

Relevant files:

- `packages/ember-ui/addon/components/dashboard/widget-panel.hbs`
- `packages/ember-ui/addon/components/dashboard/widget-panel.js`

## 23. Widget Registry System

This is one of the most important architectural parts of the homepage.

Widgets are not hardcoded into the homepage template.

They are registered through the universe widget service:

- `D:/fleetbase/packages/ember-core/addon/services/universe/widget-service.js`

Key registry capabilities:

1. `registerDashboard(name, options)`
2. `registerWidgets(dashboardName, widgets)`
3. supports default widgets
4. stores dashboards and widgets in registries

This means the homepage dashboard is registry-driven and extension-ready.

## 24. Default Homepage Widgets

Initializer:

- `D:/fleetbase/console/app/instance-initializers/initialize-widgets.js`

Default registered dashboard:

- `dashboard`

Default homepage widgets registered:

1. `fleetbase-blog`
2. `fleetbase-github-card`

Widget definitions include:

- id
- name
- description
- icon
- component
- `grid_options`
- `default: true`

This means the default homepage dashboard is seeded from initializer-driven widget registration.

## 25. Dashboard Models And Persistence

Relevant files:

- `D:/fleetbase/console/app/models/dashboard.js`
- `D:/fleetbase/console/app/models/dashboard-widget.js`
- `D:/fleetbase/console/app/serializers/dashboard.js`

Persistence behaviors:

### Dashboard model

- has many widgets
- can add widget
- can remove widget

### Dashboard widget model

- stores component name
- stores `grid_options`
- stores widget `options`
- can persist property updates

### Serializer

- handles widgets as embedded records

## 26. Dashboard Grid / Layout Editing

Grid behavior comes from:

- `packages/ember-ui/addon/components/dashboard/create.js`
- `packages/ember-ui/addon/components/dashboard/create.hbs`

Behavior:

1. dashboard widgets are rendered in GridStack
2. edit mode enables widget manipulation
3. grid changes are captured
4. each widget’s `x`, `y`, `w`, `h` are persisted into `grid_options`
5. widget remove actions appear in edit mode

So the Ember homepage dashboard is:

- multi-dashboard
- editable
- widget-driven
- persisted
- registry-backed

## 27. Runtime / Extension-Driven Homepage Systems

The homepage is deeply extension-driven even though the leaf route is small.

Key boot/runtime files:

- `D:/fleetbase/console/app/instance-initializers/load-extensions.js`
- `D:/fleetbase/console/app/instance-initializers/setup-extensions.js`
- `D:/fleetbase/console/app/instance-initializers/initialize-registries.js`
- `D:/fleetbase/console/app/instance-initializers/initialize-widgets.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe/extension-manager.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe/menu-service.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe/widget-service.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe/registry-service.js`

Runtime responsibilities:

1. load installed extensions
2. register menu items
3. register widgets
4. register dashboards
5. mount extension routes
6. expose dynamic menu entries
7. allow registry-based UI injection

This is why the homepage cannot be documented only as one static template.

## 28. Pages And Subpages Reachable From Homepage

The homepage header and dashboard can take users into many routes.

### Direct built-in reachable pages

1. `console.home`
2. `console.notifications`
3. `console.account.index`
4. `console.account.auth`
5. `console.account.organizations`
6. `console.settings.index`
7. `console.settings.two-fa`
8. `console.settings.notifications`
9. `console.admin`
10. `console.admin.branding`
11. `console.admin.organizations`
12. `console.admin.two-fa-settings`
13. `console.admin.schedule-monitor`
14. `console.admin.config.services`
15. `console.admin.config.mail`
16. `console.admin.config.filesystem`
17. `console.admin.config.queue`
18. `console.admin.config.socket`
19. `console.admin.config.notification-channels`
20. `console.extensions` when registry bridge engine is available

### Virtual or runtime-driven reachable pages

1. `console.virtual`
2. `console.account.virtual`
3. `console.settings.virtual`
4. `console.admin.virtual`

These are important because many homepage-launched destinations are not hardcoded static pages. They are runtime menu items resolved by the menu service and rendered dynamically.

## 29. Homepage Subflows Without Dedicated Static Routes

In addition to route changes, the homepage also contains non-route subflows:

1. switch organization confirmation flow
2. create or join organization modal flow
3. changelog flow
4. dark mode toggle
5. notifications tray read/remove flow
6. chat tray open/end/start flow
7. dashboard select flow
8. dashboard create flow
9. dashboard delete flow
10. dashboard edit-layout flow
11. add-widget overlay flow
12. smart-nav launcher flow
13. smart-nav customization flow

These are still part of the homepage experience even when they do not navigate to a new dedicated route immediately.

## 30. Mobile Homepage Behavior

Mobile-specific pieces:

- `Layout::MobileNavbar`
- tray components switch to full-width positioning
- smart nav desktop bar is replaced by mobile navbar behavior
- sidebar toggle handling differs from desktop

Mobile navbar files:

- `D:/fleetbase/packages/ember-ui/addon/components/layout/mobile-navbar.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/mobile-navbar.js`

Meaning:

- the homepage has a separate mobile navigation story
- documentation of homepage features must include both desktop and mobile shells

## 31. Services That Drive Homepage State

Important services involved in homepage behavior:

### Shell and session

- `currentUser`
- `session`
- `router`
- `sidebar`
- `modalsManager`
- `notifications`
- `fetch`
- `intl`

### Header-specific

- `abilities`
- `media`
- `language`
- `notification`
- `chat`
- `socket`

### Runtime/registry

- `universe`
- `universe/menu-service`
- `universe/widget-service`
- `universe/registry-service`
- `universe/extension-manager`

### Dashboard-specific

- `dashboard`

So the homepage is coordinated by services much more than by the home route itself.

## 32. Source File Inventory

### Route and shell

- `D:/fleetbase/console/app/router.js`
- `D:/fleetbase/console/app/routes/application.js`
- `D:/fleetbase/console/app/routes/console.js`
- `D:/fleetbase/console/app/routes/console/home.js`
- `D:/fleetbase/console/app/controllers/console.js`
- `D:/fleetbase/console/app/controllers/console/home.js`
- `D:/fleetbase/console/app/templates/console.hbs`
- `D:/fleetbase/console/app/templates/console/home.hbs`

### Header

- `D:/fleetbase/packages/ember-ui/addon/components/layout/header.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/dropdown.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/dropdown.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/sidebar-toggle.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/sidebar-toggle.js`

### Smart navigation and customization

- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/item.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/item.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/dropdown.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/dropdown.js`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/customizer.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/layout/header/smart-nav-menu/customizer.js`

### Trays

- `D:/fleetbase/packages/ember-ui/addon/components/locale-selector-tray.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/locale-selector-tray.js`
- `D:/fleetbase/packages/ember-ui/addon/components/notification-tray.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/notification-tray.js`
- `D:/fleetbase/packages/ember-ui/addon/components/chat-tray.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/chat-tray.js`
- `D:/fleetbase/packages/ember-ui/addon/components/chat-container.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/chat-container.js`

### Dashboard

- `D:/fleetbase/packages/ember-ui/addon/components/dashboard.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard.js`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard/create.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard/create.js`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard/widget-panel.hbs`
- `D:/fleetbase/packages/ember-ui/addon/components/dashboard/widget-panel.js`
- `D:/fleetbase/packages/ember-ui/addon/services/dashboard.js`
- `D:/fleetbase/console/app/models/dashboard.js`
- `D:/fleetbase/console/app/models/dashboard-widget.js`
- `D:/fleetbase/console/app/serializers/dashboard.js`
- `D:/fleetbase/console/app/instance-initializers/initialize-widgets.js`

### Runtime / extension system

- `D:/fleetbase/console/app/instance-initializers/load-extensions.js`
- `D:/fleetbase/console/app/instance-initializers/setup-extensions.js`
- `D:/fleetbase/console/app/instance-initializers/initialize-registries.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe/menu-service.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe/widget-service.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe/registry-service.js`
- `D:/fleetbase/packages/ember-core/addon/services/universe/extension-manager.js`
- `D:/fleetbase/packages/ember-core/addon/utils/load-installed-extensions.js`
- `D:/fleetbase/packages/ember-core/addon/utils/map-engines.js`

### Virtual route surfaces

- `D:/fleetbase/console/app/routes/console/virtual.js`
- `D:/fleetbase/console/app/routes/console/account/virtual.js`
- `D:/fleetbase/console/app/routes/console/settings/virtual.js`
- `D:/fleetbase/console/app/routes/console/admin/virtual.js`
- `D:/fleetbase/console/app/templates/console/virtual.hbs`
- `D:/fleetbase/console/app/templates/console/account/virtual.hbs`
- `D:/fleetbase/console/app/templates/console/settings/virtual.hbs`
- `D:/fleetbase/console/app/templates/console/admin/virtual.hbs`

## 33. Final Summary

The Ember homepage is best understood as:

- a thin leaf route
- inside a rich authenticated console shell
- with a feature-dense global header
- a hidden-sidebar homepage mode
- a dashboard-driven main body
- registry-driven widgets
- extension-driven smart navigation
- tray/dropdown-driven interaction flows
- and many route-backed or runtime-backed subpages launched from the home shell

If you want a next companion document, the cleanest follow-up would be:

1. a homepage route tree reference only
2. a homepage header-only deep-dive
3. a homepage React migration checklist based on this documentation
