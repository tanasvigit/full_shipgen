# React Homepage Build Order For Parity

This document gives the exact implementation order to bring the React homepage closer to the original Ember homepage without creating unnecessary rework.

It is based on:

- `admin-docs/home page/ember-homepage-documentation.md`
- `admin-docs/home page/react-vs-ember-homepage-parity.md`

## Goal

Close the biggest Ember homepage parity gaps in the cleanest order:

1. finish the homepage shell first
2. then complete the header-backed destination pages
3. then upgrade tray and menu behavior
4. then fix smart navigation runtime parity
5. then finish dashboard service and widget parity
6. then do final visual and interaction refinement

## Core Principle

Do **not** keep polishing individual homepage pieces in isolation.

That creates rework because the biggest remaining gaps are still in the system around the homepage:

- the shared console shell
- header-triggered destination pages
- runtime menu and widget registration
- dashboard service behavior
- shell-level mobile and injection behavior

## Recommended Build Order

## Phase 1. Homepage Shell Completion

### Priority

`highest`

### Why first

The homepage route itself is intentionally thin in both Ember and React.

That means the fastest way to gain real parity is not to keep editing `HomePage.tsx` in isolation. The bigger missing piece is the shell around it.

### Build in this phase

1. Add the missing home-shell pieces that Ember expects:
   - home 2FA alert support
   - real homepage sidebar-hide behavior
   - richer right-side context panel behavior
2. Decide how the React shell should represent the Ember home mode:
   - fully hide sidebar on home-like routes
   - keep sidebar behavior different for account/settings/admin routes
3. Promote `console-home-wormhole` into the same first-class portal/wormhole model used by the rest of the React shell.
4. Add the missing header injection targets needed for future parity:
   - `view-header-left-content-a`
   - `view-header-left-content-b`
   - keep `view-header-actions`
5. Make homepage route behavior more explicitly route-aware in the shell instead of indirectly approximated through rail mode.

### Files likely involved

- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/RightPanel.tsx`
- `react-console/src/pages/HomePage.tsx`
- `react-console/src/components/portal/Portal.tsx`
- `react-console/src/shared/foundationTypes.ts`

### Exit criteria

- homepage shell mode is clearly different from non-home routes
- home route can render 2FA alert area and shell-level injection targets
- React shell structure starts matching Ember home composition instead of only the visual outline

## Phase 2. Header Destination Page Parity

### Priority

`very high`

### Why second

Right now many header menus look usable, but their destination pages are still placeholders.

That means the user can open a polished trigger and land on a foundation page, which breaks the illusion of parity immediately.

### Build in this phase

Replace placeholder/foundation destinations with real homepage-connected surfaces in this exact order:

1. `/notifications`
2. `/chat`
3. `/profile`
4. `/extensions`
5. `/customization`

### Why this order

1. `Notifications` and `Chat` are the most visible tray-backed destinations in the homepage shell.
2. `Profile` is directly exposed from the user menu and should stop feeling placeholder-grade.
3. `Extensions` and `Customization` should be upgraded after smart-nav behavior is already visually established.

### Build in this phase

For each destination:

1. match Ember information hierarchy
2. remove obvious foundation/placeholder language
3. preserve shared shell context
4. connect the page with the tray/menu flow that launches it
5. keep these pages compatible with future runtime registration and backend integration

### Files likely involved

- `react-console/src/pages/foundation/NotificationsFoundationPage.tsx`
- `react-console/src/pages/foundation/ChatPage.tsx`
- `react-console/src/pages/foundation/ProfilePage.tsx`
- `react-console/src/pages/foundation/ExtensionsPage.tsx`
- `react-console/src/pages/foundation/CustomizationPage.tsx`
- `react-console/src/App.tsx`

### Exit criteria

- header-launched pages no longer break parity immediately
- the homepage shell leads into real route-backed experiences instead of foundation placeholders
- the main user-visible gaps shift from missing pages to deeper behavioral differences

## Phase 3. Header Tray And Menu Behavior Parity

### Priority

`high`

### Why third

Once the destination pages exist, the tray and menu interactions themselves become the next obvious mismatch.

This is where Ember feels enterprise-grade: the triggers, trays, menus, and action flows all behave like part of one connected shell.

### Build in this phase

#### Languages

1. upgrade locale handling from static/local-only behavior toward a service-driven contract
2. prepare backend-ready persistence flow
3. align locale state with current-user preference shape

#### Notifications

1. refine unread behavior
2. align tray actions with destination page actions
3. prepare socket/event-driven update shape
4. add sound/receipt-ready hooks if desired, even if still mocked initially

#### Chat

1. refine channel open/start/end flows
2. make drawer and future chat workspace share a common model
3. prepare persistent chat-window architecture instead of a tray-only mental model

#### Organization Menu

1. expand session summary
2. make organization switching feel less static
3. replace placeholder create/join actions with real flows or proper modal stubs
4. add version/admin/runtime item support

#### User Menu

1. replace placeholder actions with real destinations or real stubs
2. improve changelog/support/docs/developer item parity
3. align theme toggle placement and session summary behavior

### Files likely involved

- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/modules/header/languages/**`
- `react-console/src/modules/header/notifications/**`
- `react-console/src/modules/header/chat/**`
- `react-console/src/modules/header/organization/**`
- `react-console/src/modules/header/profile/**`
- `react-console/src/modules/header/shared/useHeaderActionDispatcher.ts`
- `react-console/src/store/currentUserStore.ts`
- `react-console/src/store/notificationStore.ts`
- `react-console/src/store/chatStore.ts`

### Exit criteria

- header menus stop feeling mostly mock-demo driven
- organization and user menus feel closer to Ember session menus
- tray and destination page behavior feels like one connected system

## Phase 4. Smart Navigation Runtime Parity

### Priority

`high`

### Why fourth

The React smart navigation UX already exists, but it is still driven by static registry items plus mock extensions.

Ember’s homepage depends much more deeply on runtime menu registration and user-aware menu preferences, so this needs to be fixed before the dashboard and extension surfaces can be considered parity-ready.

### Build in this phase

1. Replace the current mostly static smart-nav bootstrap with a runtime-driven header item source.
2. Separate navigation items into:
   - core built-in items
   - runtime extension items
   - shortcut items
   - overflow-only items
3. Add permission filtering support to the navigation resolution path.
4. Improve overflow logic so it behaves more like a width-aware system rather than only a coarse breakpoint system.
5. Move persistence shape closer to Ember user-option semantics, even if backend sync still comes later.
6. Make launcher/customizer state consume the same resolved navigation graph instead of parallel local assumptions.

### Files likely involved

- `react-console/src/modules/header/useHeaderBootstrap.ts`
- `react-console/src/registry/navigationRegistry.ts`
- `react-console/src/store/navigationStore.ts`
- `react-console/src/modules/navigation/smart-nav/useSmartNavigation.ts`
- `react-console/src/modules/navigation/smart-nav/SmartNavigationBar.tsx`
- `react-console/src/modules/navigation/extensions/ExtensionLauncher.tsx`
- `react-console/src/modules/navigation/customization/NavigationCustomizationModal.tsx`
- `react-console/src/store/extensionStore.ts`
- `react-console/src/services/mockExtensionService.ts`

### Exit criteria

- smart nav is no longer mostly mock-bootstrapped
- launcher, customization, and visible header items all derive from one resolved runtime graph
- the homepage top navigation behaves more like Ember’s real smart navigation system

## Phase 5. Runtime Extension And Injection Parity

### Priority

`medium-high`

### Why fifth

After smart navigation is runtime-driven, the next missing parity layer is shell-wide extensibility.

This is the part that makes the Ember homepage feel install-aware rather than static.

### Build in this phase

1. Expand runtime manifest usage beyond route mounting so homepage shell surfaces can consume it.
2. Support richer home/header injection behavior through the React portal system.
3. Strengthen the relationship between:
   - runtime config
   - manifest parsing
   - virtual routes
   - header item registration
   - extension launcher visibility
4. Reduce duplication between mock extension data and runtime manifest data.
5. Make home-specific injection a first-class capability, not just a raw DOM target.

### Files likely involved

- `react-console/src/lib/runtimeConfig.ts`
- `react-console/src/lib/extensions.ts`
- `react-console/src/pages/VirtualPage.tsx`
- `react-console/src/extensions/host.tsx`
- `react-console/src/extensions/registry.tsx`
- `react-console/src/components/portal/Portal.tsx`
- `react-console/src/store/extensionStore.ts`

### Exit criteria

- homepage runtime behavior is no longer limited to simple virtual route hosting
- extensions can influence the home shell in a more Ember-like way
- the React homepage becomes structurally more install-aware and less static

## Phase 6. Dashboard Service And Widget Parity

### Priority

`medium-high`

### Why sixth

The React dashboard is already one of the strongest implemented homepage systems.

That is exactly why it should not be rewritten too early. It should first inherit the improved shell and runtime context from earlier phases, then be upgraded into closer parity.

### Build in this phase

1. Upgrade dashboard state flow from mock-only behavior toward a service-driven contract.
2. Align dashboard selector behavior with Ember concepts:
   - current dashboard
   - default dashboard
   - recent dashboards
   - per-extension scoping
3. Complete the action set:
   - create new dashboard
   - switch dashboard
   - delete dashboard
   - edit layout
   - add widgets
4. Decide how React should represent Ember default homepage widget seeding:
   - true seeded defaults
   - or a compatible system/default dashboard concept
5. Make widget registration less static and more compatible with runtime registration.
6. Preserve existing drag/drop, resize, edit-mode, and widget-picker work.
7. Tighten the relationship between dashboard persistence and extension scoping.

### Important note

Do **not** throw away the existing React dashboard architecture.

It already has substantial value:

- selector
- actions
- widget shell
- drag/drop
- resizing
- edit mode
- local persistence

The correct move is to upgrade it toward Ember service/runtime parity, not replace it.

### Files likely involved

- `react-console/src/modules/dashboard/HomeDashboard.tsx`
- `react-console/src/store/dashboardStore.ts`
- `react-console/src/services/mockDashboardService.ts`
- `react-console/src/modules/dashboard/selector/DashboardSelector.tsx`
- `react-console/src/modules/dashboard/actions/DashboardActionsMenu.tsx`
- `react-console/src/modules/dashboard/registry/widgetRegistry.tsx`
- `react-console/src/modules/dashboard/widget-picker/WidgetPickerModal.tsx`
- `react-console/src/modules/dashboard/shared/resolveDashboardExtension.ts`

### Exit criteria

- dashboard state and actions read more like Ember’s dashboard model
- widget registration stops feeling purely static/mock-driven
- the homepage dashboard becomes closer to Ember without losing the React work already built

## Phase 7. Mobile Shell And Global Chat Surface Parity

### Priority

`medium`

### Why seventh

These are major parity gaps, but they depend on earlier shell and tray decisions.

If implemented too early, they would likely be rebuilt after the shell, tray, and runtime work settle.

### Build in this phase

1. Add a homepage-appropriate mobile navbar behavior.
2. Add a global chat container model so chat is not only a drawer.
3. Support persistent chat windows or a structurally equivalent React pattern.
4. Add shell-level session surfaces such as impersonation/support trays if needed for parity.
5. Audit mobile tray positioning and mobile header behavior against Ember.

### Files likely involved

- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/modules/header/chat/**`
- new shell-level mobile/chat modules if needed

### Exit criteria

- mobile homepage feels intentionally designed rather than desktop behavior compressed down
- chat exists as a shell-level system, not only a tray interaction
- the last major shell-level parity gaps are structurally addressed

## Phase 8. Final Visual And Interaction Parity Pass

### Priority

`final polish`

### Why last

This phase should happen only after the structural work is done. Otherwise visual polish will be broken by later changes in shell, menus, smart nav, and dashboard behavior.

### Build in this phase

1. tighten homepage spacing to Ember density
2. refine header alignment and tray positioning
3. refine smart-nav hover, active, and overflow states
4. refine dashboard header spacing and canvas density
5. align menu widths, paddings, and empty states
6. standardize shell transitions and motion timing
7. remove any remaining placeholder wording and mock-demo feel

### Exit criteria

- homepage feels consistent end-to-end
- React-vs-Ember visual mismatches are reduced to minor details
- the homepage no longer reads as a mix of polished systems and placeholder systems

## What Should Explicitly Wait Until Later

Do **not** start these too early:

### 1. Final visual polish on placeholder pages

Do this only after:

- placeholder pages are replaced
- shell and tray structure is stable

### 2. Heavy dashboard rewrites

Do this only after:

- smart nav runtime parity exists
- extension/runtime shape is clearer

### 3. Deep backend integration

Do this only after:

- React parity contracts are stable
- shell and dashboard APIs are clearly defined

### 4. Rebuilding every homepage feature around realtime first

Do this only after:

- destination pages exist
- tray/menu architecture is stable

## Cleanest Delivery Milestones

If you want to split the work into reviewable chunks, use these milestones:

### Milestone 1

Homepage shell parity:

- hidden-home shell mode
- 2FA alert area
- portal/injection target parity
- better right-panel behavior

### Milestone 2

Header destination page parity:

- notifications
- chat
- profile
- extensions
- customization

### Milestone 3

Header interaction parity:

- languages
- notifications tray behavior
- chat behavior
- organization menu
- user menu

### Milestone 4

Smart-nav runtime parity:

- runtime header items
- launcher alignment
- customizer alignment
- permission-aware resolution

### Milestone 5

Runtime home shell + dashboard parity:

- extension injection
- virtual/runtime alignment
- dashboard service and widget parity

### Milestone 6

Mobile and final polish:

- mobile shell
- global chat surface
- final visual parity pass

## Fastest Path To Visible Progress

If the goal is to make the React homepage look closer to Ember as fast as possible, the shortest high-impact path is:

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 6
5. Phase 8

This order gives the best visible improvement quickly because:

- shell parity changes the whole homepage immediately
- replacing placeholder destination pages removes the most obvious breaks
- better tray/menu behavior improves every header interaction
- dashboard parity deepens the main body after shell/header are believable
- polish matters more once the structure is stable

## Final Recommendation

The correct implementation order is:

1. **Homepage shell completion**
2. **Header destination page parity**
3. **Header tray and menu behavior parity**
4. **Smart navigation runtime parity**
5. **Runtime extension and injection parity**
6. **Dashboard service and widget parity**
7. **Mobile shell and global chat surface parity**
8. **Final visual and interaction parity**

This is the cleanest order because it follows dependency flow:

- shell before page polish
- destination pages before tray refinement
- smart-nav runtime before deeper extension parity
- runtime context before dashboard parity upgrades
- mobile and polish after structural decisions stabilize
