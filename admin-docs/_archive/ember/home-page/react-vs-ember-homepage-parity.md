# React vs Ember Homepage Parity

This document compares:

- the original Ember homepage documented in `admin-docs/home page/ember-homepage-documentation.md`
- the current React homepage implementation in `D:/fleetbase/react-console`

The goal is to classify the React homepage by feature and clearly show:

- what is completed
- what is partially completed
- what is still missing
- what the remaining gaps are

## Status Legend

- `done`: the React implementation is close enough to Ember in structure and behavior
- `partial`: the React implementation exists, but is simplified, mock-backed, incomplete, or behaviorally different
- `missing`: Ember behavior is not represented yet, or React only has a placeholder

## Short Answer

The React homepage is **not at full Ember parity yet**.

It has:

- the overall shell shape
- top header scaffolding
- smart navigation foundation
- a substantial dashboard system
- runtime route infrastructure

But it is still largely a **partial parity implementation**, especially in:

- real home shell completeness
- realtime header trays
- placeholder destination pages
- dashboard default seeding and backend-driven behavior
- extension-driven homepage/runtime behavior

## Overall Classification

### Done

- no major homepage category is fully `done` at Ember parity level

### Partial

1. homepage route and shell
2. top header structure
3. languages
4. notifications tray
5. chat tray
6. organization menu
7. user/profile menu
8. smart navigation
9. overflow/extensions launcher
10. navigation customization
11. dashboard selector
12. dashboard actions
13. dashboard editing and widget management
14. runtime/virtual route infrastructure
15. pages and subpages reachable from the homepage

### Missing

1. homepage 2FA alert parity
2. true homepage sidebar-hide behavior parity
3. mobile navbar parity
4. global chat container / persistent chat window parity
5. impersonator tray parity
6. registry-yield style homepage/shell injection parity
7. realtime notifications parity
8. realtime chat parity
9. fully implemented notifications center page
10. fully implemented chat workspace page
11. fully implemented extensions/customization/profile foundation pages
12. dashboard default widget seeding parity
13. backend-driven dashboard behavior parity
14. full extension-driven homepage/menu/widget parity

## 1. Homepage Route Chain

### Ember

- `application -> console -> console.home`
- shell route at `/`
- homepage leaf route also at `/`

### React

- authenticated `/` mounts `AppLayout -> AppShell -> HomePage`
- `HomePage` is intentionally thin and delegates to `HomeDashboard`

Key files:

- `D:/fleetbase/react-console/src/App.tsx`
- `D:/fleetbase/react-console/src/layout/AppLayout.tsx`
- `D:/fleetbase/react-console/src/layouts/AppShell.tsx`
- `D:/fleetbase/react-console/src/pages/HomePage.tsx`

### Status

- `partial`

### What React completed

- there is a real authenticated home route
- it is mounted inside a shared console shell
- the homepage leaf is also intentionally thin, similar to Ember
- React keeps a `console-home-wormhole` div in `HomePage.tsx`

### Gaps

- Ember home route includes `TwoFaEnforcementAlert`, React home does not
- Ember home is part of a richer shell with chat container, impersonator tray, registry yield, and mobile navbar
- React home relies on a simplified shell and does not yet replicate those shell-level home additions

## 2. Console Shell Around Home

### Ember

Shell includes:

1. header
2. main layout
3. sidebar host
4. section outlet
5. resource context panel
6. mobile navbar
7. chat container
8. console wormhole
9. impersonator tray
10. registry yield

### React

Shell includes:

1. `TopHeader`
2. `SidebarHost`
3. route outlet
4. `RightPanel`
5. `OverlayLayer`

Key files:

- `D:/fleetbase/react-console/src/layouts/AppShell.tsx`
- `D:/fleetbase/react-console/src/layouts/SidebarHost.tsx`
- `D:/fleetbase/react-console/src/layouts/TopHeader.tsx`
- `D:/fleetbase/react-console/src/layouts/RightPanel.tsx`
- `D:/fleetbase/react-console/src/components/portal/Portal.tsx`

### Status

- `partial`

### What React completed

- authenticated shell exists
- shared header exists
- sidebar host exists
- outlet-based page body exists
- portal/wormhole infrastructure exists

### Gaps

- `RightPanel.tsx` is still placeholder-grade and not equivalent to Ember resource/context behavior
- no global chat container equivalent
- no impersonator tray equivalent
- no mobile navbar equivalent
- no registry yield equivalent in the home shell

## 3. Homepage Sidebar Behavior

### Ember

- homepage intentionally hides the sidebar
- home relies on smart nav in header instead

### React

- `AppShell.tsx` switches homepage-like routes into `rail` mode
- the sidebar is reduced, but not conceptually matched to Ember’s hidden-home behavior

Files:

- `D:/fleetbase/react-console/src/layouts/AppShell.tsx`
- `D:/fleetbase/react-console/src/layouts/SidebarHost.tsx`
- `D:/fleetbase/react-console/src/store/uiStore.ts`

### Status

- `partial`

### What React completed

- homepage-like routes are treated differently from other shell routes
- admin/profile/settings/customization navigation can live in the sidebar without conflicting with home

### Gaps

- React uses rail/collapse behavior instead of the cleaner Ember home sidebar-hide model
- the shell intent is similar, but the behavior is not a direct parity match

## 4. Homepage Body

### Ember

Homepage body contains:

1. `TwoFaEnforcementAlert`
2. `Dashboard @extension="core"`
3. `Spacer`
4. `console-home-wormhole`

### React

Homepage body currently contains:

1. `HomeDashboard`
2. spacer
3. `console-home-wormhole`

File:

- `D:/fleetbase/react-console/src/pages/HomePage.tsx`

### Status

- `partial`

### What React completed

- dashboard is the central home body
- a local home wormhole target exists

### Gaps

- no home 2FA alert equivalent
- no homepage-local injected content system comparable to Ember’s broader shell/runtime composition

## 5. Header Structure

### Ember

Header includes:

- logo
- sidebar toggle
- smart navigation
- left-side wormhole targets
- loading indicator
- `view-header-actions`
- languages
- notifications
- chat
- organization menu
- user menu

### React

Header includes:

- logo
- smart navigation bar
- languages trigger
- notifications trigger
- chat trigger
- organization trigger
- user trigger

File:

- `D:/fleetbase/react-console/src/layouts/TopHeader.tsx`

### Status

- `partial`

### What React completed

- the main header groups exist
- the major header trigger surfaces are present
- the overall visual structure is comparable

### Gaps

- Ember has richer shell/header injection points
- React has only limited portal targets and does not include Ember’s full header-left injection story
- some header destinations still lead to placeholder pages

## 6. Languages

### Ember

- locale tray
- current locale from intl
- change locale in app immediately
- persist with backend request

### React

Files:

- `D:/fleetbase/react-console/src/modules/header/languages/LanguagesTray.tsx`
- `D:/fleetbase/react-console/src/modules/header/languages/useLanguagesTray.ts`
- `D:/fleetbase/react-console/src/modules/header/languages/adapters.ts`
- `D:/fleetbase/react-console/src/store/currentUserStore.ts`
- `D:/fleetbase/react-console/src/services/mockUserService.ts`

### Status

- `partial`

### What React completed

- tray exists
- active locale indicator exists
- locale switching exists
- local persistence behavior exists through the user store/mock service path

### Gaps

- no Ember-style backend persistence flow
- locale list is static
- no parity with the original intl/language-service integration model

## 7. Notifications

### Ember

- realtime tray
- unread badge
- socket subscriptions
- sound
- mark as read
- full notifications route with real controls

### React

Files:

- `D:/fleetbase/react-console/src/modules/header/notifications/NotificationsTray.tsx`
- `D:/fleetbase/react-console/src/modules/header/notifications/useNotificationsTray.ts`
- `D:/fleetbase/react-console/src/store/notificationStore.ts`
- `D:/fleetbase/react-console/src/services/mockNotificationService.ts`
- `D:/fleetbase/react-console/src/pages/foundation/NotificationsFoundationPage.tsx`

### Status

- `partial`

### What React completed

- notifications tray exists
- unread badge exists
- grouped tray list exists
- mark as read / clear-all interactions exist in the local store flow

### Gaps

- no socket/realtime behavior
- no backend-driven unread store
- no sound behavior matching Ember
- `/notifications` is still a foundation/placeholder page rather than real parity

## 8. Chat

### Ember

- realtime chat tray
- unread count
- chat channel lifecycle
- global chat windows
- start/open/end flows

### React

Files:

- `D:/fleetbase/react-console/src/modules/header/chat/ChatDrawer.tsx`
- `D:/fleetbase/react-console/src/modules/header/chat/useChatTray.ts`
- `D:/fleetbase/react-console/src/store/chatStore.ts`
- `D:/fleetbase/react-console/src/services/mockChatService.ts`
- `D:/fleetbase/react-console/src/pages/foundation/ChatPage.tsx`

### Status

- `partial`

### What React completed

- chat trigger exists
- unread count exists
- drawer UI exists
- channel list and message preview UI exist

### Gaps

- no realtime socket behavior
- no persistent global chat container/windows
- message composer is still mock/read-only in spirit
- `/chat` remains a foundation/placeholder route

## 9. Organization Menu

### Ember

Includes:

- session summary
- organization switcher
- Home
- organization settings
- create/join organization
- optional explore extensions
- runtime organization menu items
- app version
- admin
- logout

### React

Files:

- `D:/fleetbase/react-console/src/modules/header/organization/OrganizationMenu.tsx`
- `D:/fleetbase/react-console/src/modules/header/organization/useOrganizationMenu.ts`
- `D:/fleetbase/react-console/src/modules/header/organization/adapters.ts`

### Status

- `partial`

### What React completed

- organization menu exists
- current organization is represented
- Home/settings/admin/logout paths are represented

### Gaps

- menu is mostly static
- create/join and related org actions are placeholder-like
- no runtime `organizationMenuItems` equivalent
- no version entry parity
- no feature parity with Ember’s richer org/session summary composition

## 10. User / Profile Menu

### Ember

Includes:

- user summary
- profile
- keyboard shortcuts placeholder
- changelog
- optional developers
- support/docs links
- runtime user items
- dark mode toggle
- logout

### React

Files:

- `D:/fleetbase/react-console/src/modules/header/profile/ProfileMenu.tsx`
- `D:/fleetbase/react-console/src/modules/header/profile/useProfileMenu.ts`
- `D:/fleetbase/react-console/src/modules/header/profile/adapters.ts`
- `D:/fleetbase/react-console/src/pages/foundation/ProfilePage.tsx`

### Status

- `partial`

### What React completed

- user menu exists
- theme toggle exists
- logout exists
- profile/account-related menu shape exists

### Gaps

- several menu actions are placeholder-only
- no runtime user menu item parity
- profile destination is still a foundation/placeholder page
- not yet equivalent to Ember’s support/developer/changelog depth

## 11. Smart Navigation

### Ember

- driven by `universe.headerMenuItems`
- permission filtering
- shortcuts promoted into first-class header items
- resize-aware overflow
- persistent per-user customization

### React

Files:

- `D:/fleetbase/react-console/src/modules/navigation/smart-nav/SmartNavigationBar.tsx`
- `D:/fleetbase/react-console/src/modules/navigation/smart-nav/useSmartNavigation.ts`
- `D:/fleetbase/react-console/src/store/navigationStore.ts`
- `D:/fleetbase/react-console/src/modules/header/useHeaderBootstrap.ts`
- `D:/fleetbase/react-console/src/registry/navigationRegistry.ts`

### Status

- `partial`

### What React completed

- pinned nav exists
- active nav highlighting exists
- overflow exists
- recent use tracking exists
- customization and persistence exist

### Gaps

- not driven by an Ember-like runtime universe/menu registry
- no permission filtering parity
- behavior is local-store driven and mock-bootstrapped
- overflow visibility is simpler than Ember’s smarter width-driven model

## 12. Extensions Overflow / Launcher

### Ember

- searchable launcher
- extension cards
- shortcut cards
- quick pin
- customization entry

### React

Files:

- `D:/fleetbase/react-console/src/modules/navigation/extensions/ExtensionLauncher.tsx`
- `D:/fleetbase/react-console/src/modules/navigation/command-grid/SearchableCommandGrid.tsx`

### Status

- `partial`

### What React completed

- searchable launcher exists
- grouped grid exists
- recent items exist
- pin/unpin exists

### Gaps

- driven by mock extension data
- not backed by real installed extension/runtime menu behavior like Ember
- extension routes/pages behind it are still a mixed bag of real, mock, and placeholder

## 13. Navigation Customization

### Ember

- customizer panel
- pin/unpin
- reorder
- reset
- user preference persistence

### React

Files:

- `D:/fleetbase/react-console/src/modules/navigation/customization/NavigationCustomizationModal.tsx`
- `D:/fleetbase/react-console/src/store/navigationStore.ts`

### Status

- `partial`

### What React completed

- modal exists
- pin/unpin exists
- drag reorder exists
- reset exists
- local persistence exists

### Gaps

- persistence is browser-local, not equivalent to Ember user-option persistence
- not wired to runtime header item contracts with the same depth as Ember

## 14. Dashboard System

### Ember

- shared dashboard service
- dashboard selector
- create dashboard
- delete dashboard
- edit layout
- add widget overlay
- widget registry
- default widget seeding
- persisted dashboard/widget records

### React

Files:

- `D:/fleetbase/react-console/src/modules/dashboard/HomeDashboard.tsx`
- `D:/fleetbase/react-console/src/store/dashboardStore.ts`
- `D:/fleetbase/react-console/src/services/mockDashboardService.ts`
- `D:/fleetbase/react-console/src/modules/dashboard/selector/DashboardSelector.tsx`
- `D:/fleetbase/react-console/src/modules/dashboard/actions/DashboardActionsMenu.tsx`
- `D:/fleetbase/react-console/src/modules/dashboard/editing/useDashboardEditing.ts`
- `D:/fleetbase/react-console/src/modules/dashboard/layouts/DashboardGrid.tsx`
- `D:/fleetbase/react-console/src/modules/dashboard/widget-picker/WidgetPickerModal.tsx`
- `D:/fleetbase/react-console/src/modules/dashboard/registry/widgetRegistry.tsx`
- `D:/fleetbase/react-console/src/modules/dashboard/widgets/MockWidgets.tsx`

### Status

- `partial`

### What React completed

- dashboard container exists
- dashboard selector exists
- multiple dashboards exist
- dashboard actions exist
- edit mode exists
- drag/drop exists
- resize exists
- widget picker exists
- widget registry exists

### Gaps

- no Ember-style backend/service-driven dashboard persistence
- no default widget seeding equivalent; mock dashboards currently start empty
- action set is still not a full parity match
- widget registry is static and mock-oriented instead of universe/extension-driven

## 15. Dashboard Selector

### Status

- `partial`

### Completed

- current dashboard indicator exists
- switching UI exists
- recent dashboards support exists

### Gaps

- still local/mock-backed
- not equivalent to Ember’s dashboard service and backend default-switch behavior

## 16. Dashboard Actions

### Status

- `partial`

### Completed

- rename
- duplicate
- reset layout
- set default
- manage widgets

### Gaps

- Ember’s explicit create-new-dashboard flow is not matched as cleanly
- some actions remain placeholder-grade
- not backend-driven

## 17. Default Dashboard State

### Ember

- seeded with default widgets through initializer/widget registry

### React

- mock dashboard service returns empty widget arrays by default

### Status

- `missing`

### Gap

- React does not currently match Ember’s seeded default homepage widget behavior

## 18. Reachable Pages And Subpages From Homepage

### Status

- `partial`

### What React completed

React exposes many route-backed destinations from home:

- `/`
- `/dashboard`
- `/profile`
- `/extensions`
- `/customization`
- `/notifications`
- `/chat`
- `/account/*`
- `/settings/*`
- `/admin/*`
- `/fleet-ops/*`
- virtual routes under `/:slug`, `/account/:slug`, `/settings/:slug`, `/admin/:slug`

### Gaps

The biggest issue is destination quality, not route count:

- `/notifications` is foundation placeholder
- `/chat` is foundation placeholder
- `/extensions` is foundation placeholder
- `/customization` is foundation placeholder
- `/profile` is foundation placeholder
- route coverage is still not a perfect Ember match for all homepage-launched destinations

## 19. Runtime / Extension-Driven Homepage Parity

### Ember

- deep universe/menu/widget/registry/extension-manager integration
- header items, shortcuts, widgets, and virtual pages are runtime-driven

### React

Files:

- `D:/fleetbase/react-console/src/lib/runtimeConfig.ts`
- `D:/fleetbase/react-console/src/lib/extensions.ts`
- `D:/fleetbase/react-console/src/pages/VirtualPage.tsx`
- `D:/fleetbase/react-console/src/extensions/host.tsx`
- `D:/fleetbase/react-console/src/extensions/registry.tsx`
- `D:/fleetbase/react-console/src/store/extensionStore.ts`
- `D:/fleetbase/react-console/src/services/mockExtensionService.ts`

### Status

- `partial`

### What React completed

- runtime config loading exists
- extension manifest parsing exists
- virtual route mounting exists
- native extension component registry exists

### Gaps

- homepage is not yet powered by an Ember-equivalent runtime universe/menu/widget system
- smart nav and dashboard are not truly extension-registry driven in the same way
- runtime injection into the home shell is limited
- React is still much more mock-driven than Ember here

## 20. Completed vs Partial vs Missing Summary

### Completed enough to use, but not yet Ember-parity complete

- authenticated home route exists
- shared console shell exists
- top header exists
- smart nav exists
- overflow launcher exists
- nav customization exists
- dashboard editor foundation exists
- runtime virtual route foundation exists

### Partial

- home shell parity
- home body parity
- languages
- notifications
- chat
- organization menu
- user menu
- smart nav parity
- overflow/extensions launcher parity
- dashboard selector
- dashboard actions
- dashboard editing
- reachable route ecosystem
- runtime extension parity

### Missing

- home 2FA alert
- mobile navbar parity
- global chat container parity
- impersonator tray parity
- registry-yield shell parity
- realtime notifications
- realtime chat
- non-placeholder notifications center
- non-placeholder chat workspace
- non-placeholder extensions/customization/profile destinations
- Ember-style seeded default dashboard widgets
- fully backend-driven dashboard behavior

## 21. Main Gap Files

The most important React files showing homepage parity gaps are:

- `D:/fleetbase/react-console/src/pages/HomePage.tsx`
- `D:/fleetbase/react-console/src/layouts/AppShell.tsx`
- `D:/fleetbase/react-console/src/layouts/SidebarHost.tsx`
- `D:/fleetbase/react-console/src/layouts/RightPanel.tsx`
- `D:/fleetbase/react-console/src/layouts/TopHeader.tsx`
- `D:/fleetbase/react-console/src/components/portal/Portal.tsx`
- `D:/fleetbase/react-console/src/modules/header/useHeaderBootstrap.ts`
- `D:/fleetbase/react-console/src/store/currentUserStore.ts`
- `D:/fleetbase/react-console/src/store/notificationStore.ts`
- `D:/fleetbase/react-console/src/store/chatStore.ts`
- `D:/fleetbase/react-console/src/store/extensionStore.ts`
- `D:/fleetbase/react-console/src/store/navigationStore.ts`
- `D:/fleetbase/react-console/src/store/dashboardStore.ts`
- `D:/fleetbase/react-console/src/services/mockUserService.ts`
- `D:/fleetbase/react-console/src/services/mockNotificationService.ts`
- `D:/fleetbase/react-console/src/services/mockChatService.ts`
- `D:/fleetbase/react-console/src/services/mockExtensionService.ts`
- `D:/fleetbase/react-console/src/services/mockDashboardService.ts`
- `D:/fleetbase/react-console/src/pages/foundation/NotificationsFoundationPage.tsx`
- `D:/fleetbase/react-console/src/pages/foundation/ChatPage.tsx`
- `D:/fleetbase/react-console/src/pages/foundation/ExtensionsPage.tsx`
- `D:/fleetbase/react-console/src/pages/foundation/ProfilePage.tsx`
- `D:/fleetbase/react-console/src/pages/foundation/CustomizationPage.tsx`
- `D:/fleetbase/react-console/src/modules/dashboard/HomeDashboard.tsx`
- `D:/fleetbase/react-console/src/modules/dashboard/actions/DashboardActionsMenu.tsx`
- `D:/fleetbase/react-console/src/modules/dashboard/registry/widgetRegistry.tsx`
- `D:/fleetbase/react-console/src/pages/VirtualPage.tsx`
- `D:/fleetbase/react-console/src/extensions/host.tsx`
- `D:/fleetbase/react-console/src/extensions/registry.tsx`

## 22. Final Assessment

The current React homepage should be described as:

- structurally aligned in broad shape
- feature-rich compared to a blank scaffold
- still mostly partial at Ember-parity level
- heavily mock-backed
- missing several shell-level and realtime behaviors

So if the question is:

### Is the React homepage implemented?

- yes

### Is it complete compared to Ember?

- no

### Is it closer to Ember than before?

- yes, significantly

### Is a lot of the work still partial?

- yes

The biggest remaining homepage parity gaps are:

1. shell completeness
2. realtime trays/chat
3. placeholder destination pages
4. default dashboard/widget seeding
5. full runtime/extension-driven homepage behavior
