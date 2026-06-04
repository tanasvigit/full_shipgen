# React Admin Build Order For Parity

This document gives the exact implementation order to bring the React admin panel closer to the original Ember admin panel without creating unnecessary rework.

It is based on:

- `admin-react-current-status.md`
- `admin-ember-vs-react-parity-checklist.md`
- `admin-react-migration-plan.md`

## Goal

Close the biggest Ember parity gaps in the cleanest order:

1. fix the admin shell first
2. then fix the admin page surfaces
3. then fix nested overlay flows
4. then add dynamic admin menu parity
5. then finish visual and interaction refinement

## Core Principle

Do **not** start by polishing individual admin pages in isolation.

That creates rework because the biggest missing piece is still the Ember admin system around those pages:

- admin sidebar
- system config grouping
- runtime admin panels
- nested overlay behavior

## Recommended Build Order

## Phase 1. Admin Shell Foundation

### Priority

`highest`

### Why first

This gives the biggest parity gain immediately and prevents page-level rework later.

Right now the React app has routes, but it does not yet have the Ember-style admin navigation model.

### Build in this phase

1. Add admin-aware sidebar rendering to `SidebarHost.tsx` or move admin sidebar rendering into a dedicated admin sidebar module.
2. Add the built-in admin root items:
   - Overview
   - Organizations
   - Branding
   - 2FA Config
   - Schedule Monitor
3. Add the built-in `System Config` grouped section:
   - Services
   - Mail
   - Filesystem
   - Queue
   - Socket
   - Push Notifications
4. Decide how `Database` and `Cache` should appear:
   - hidden but supported route
   - or visible admin config entries
5. Add route metadata for admin pages so the sidebar is registry-driven, not hardcoded route-by-route in component JSX.
6. Match Ember admin sidebar density and grouping behavior.

### Files likely involved

- `react-console/src/layouts/SidebarHost.tsx`
- new admin registry file such as `react-console/src/registry/adminRegistry.ts`
- optional admin sidebar component under something like `react-console/src/modules/admin/sidebar/`

### Exit criteria

- `/admin/**` shows a real admin sidebar
- core admin pages are navigable from the sidebar
- `System Config` behaves like a grouped admin section
- admin navigation no longer depends on generic non-admin sidebar logic

## Phase 2. Admin Page Frame Parity

### Priority

`very high`

### Why second

Once the admin shell exists, page work starts paying off correctly because the pages are now being experienced inside the right navigation context.

### Build in this phase

Standardize the shared admin page frame:

1. page title/header structure
2. page width and padding
3. table density
4. loading/empty/error states
5. admin section spacing
6. card/table chrome

Create or refine shared admin primitives if needed:

- `AdminPageHeader`
- `AdminSection`
- `AdminTableShell`
- `AdminEmptyState`
- `AdminPanelSection`

### Files likely involved

- shared admin UI module under `react-console/src/modules/admin/`
- the core admin page components

### Exit criteria

- admin pages feel visually related to each other
- headers and content spacing stop varying page to page
- the React admin panel starts reading as one system, not many unrelated pages

## Phase 3. Core Page Surface Parity

### Priority

`high`

### Why third

These are the pages users will see first, and they are currently `partial` rather than `done`.

### Page order inside this phase

Build these in this exact order:

1. `AdminOverviewPage`
2. `AdminOrganizationsPage`
3. `AdminBrandingPage`
4. `AdminTwoFaSettingsPage`
5. `ScheduleMonitorPage`

### Why this order

1. `AdminOverviewPage` defines the top-level admin landing impression.
2. `AdminOrganizationsPage` is one of the most central operational admin screens.
3. `AdminBrandingPage` is visible and easy to parity-check against Ember.
4. `AdminTwoFaSettingsPage` is relatively contained and benefits from the shared admin frame.
5. `ScheduleMonitorPage` should be upgraded before its logs overlay so the parent-child flow is correct.

### Build in this phase

For each page:

1. match Ember information hierarchy
2. match Ember control layout
3. add missing table columns or controls where appropriate
4. align spacing and table density
5. remove clearly React-only placeholder feel

### Exit criteria

- top-level admin pages stop feeling generic
- organizations and schedule monitor look like real admin operational screens
- overview and branding are no longer obviously simplified versions

## Phase 4. Nested Overlay Parity

### Priority

`high`

### Why fourth

These routes already exist, but Ember treats them as nested admin detail flows, not normal standalone pages.

### Pages in this phase

1. `AdminOrganizationUsersPage`
2. `ScheduleLogsPage`

### Build in this phase

1. render these inside the existing overlay/right-panel system
2. create a reusable admin detail overlay shell
3. support Ember-like:
   - right-side presentation
   - header actions
   - close behavior
   - scroll region
   - resize-ready structure
4. preserve route-driven deep linking
5. add nested search/pagination hooks where Ember has them

### Files likely involved

- overlay primitives already built in React
- `AdminOrganizationUsersPage`
- `ScheduleLogsPage`
- optional shared `AdminDetailOverlay`

### Exit criteria

- organization users no longer feels like a normal full page
- schedule logs no longer feels like a standalone screen
- nested admin drill-downs behave like Ember admin overlays

## Phase 5. Config Route Structure Parity

### Priority

`medium-high`

### Why fifth

By this point the shell, common page frame, and overlay behavior are in place, so the config section can be made structurally accurate.

### Build in this phase

1. Rework `/admin/config` so it behaves as an Ember-like config section container rather than a generic JSON editor.
2. Decide whether to:
   - redirect `/admin/config` to a default child route
   - or show a grouped config landing state
3. Align `Database` and `Cache` handling with the intended admin information architecture.
4. Keep the strong existing config forms, but place them inside a consistent config-section experience.

### Important note

Do **not** throw away the existing React config forms.

Most of them are already among the strongest admin pages in the React app.

### Exit criteria

- `/admin/config` no longer feels like a placeholder
- config pages feel like one grouped admin subsystem
- existing strong config page work is preserved

## Phase 6. Dynamic Admin Registry And Virtual Route Parity

### Priority

`medium-high`

### Why sixth

This should come after the core shell and page model are stable, otherwise the dynamic system will be built on top of moving foundations.

### Build in this phase

1. Create an admin-specific registry model that separates:
   - core admin items
   - admin config group items
   - extension-driven admin items
   - extension-driven admin panels
2. Upgrade `VirtualPage` so admin scope behaves differently from generic console virtual routes.
3. Make `/admin/:slug` consume admin route metadata rather than just showing a generic host shell.
4. Connect the admin sidebar to this registry so runtime items can appear in the correct groups.

### Files likely involved

- `react-console/src/pages/VirtualPage.tsx`
- new admin registry files
- extension manifest adapter logic
- admin sidebar rendering layer

### Exit criteria

- `/admin/:slug` feels like a real admin page host
- dynamic admin items can appear in the sidebar cleanly
- admin dynamic pages stop feeling generic

## Phase 7. Runtime Admin Panels

### Priority

`medium`

### Why seventh

These are important for full parity, but they depend on the registry model and sidebar grouping from earlier phases.

### Build in this phase

Support Ember-style runtime admin panels such as:

- `Fleet-Ops Config`
- `Extensions Registry`

This phase should support:

1. grouped admin panels in the sidebar
2. panel headings
3. panel children
4. route-backed panel items
5. virtual-route-backed panel items
6. future runtime registration

### Exit criteria

- extension-driven admin panels can be represented in the React sidebar
- the admin area can grow without hardcoded JSX branches

## Phase 8. Final Visual And Interaction Parity Pass

### Priority

`final polish`

### Why last

This phase should happen only after the structural work is done. Otherwise the visual work will get broken by later layout changes.

### Build in this phase

1. tighten admin spacing to Ember density
2. refine sidebar active states and grouping visuals
3. refine config page spacing and labels
4. refine overlay transitions and dimensions
5. align table row density and action placement
6. review typography and card chrome
7. remove any remaining placeholder/generic wording

### Exit criteria

- the admin area feels consistent end-to-end
- the biggest visible React-vs-Ember mismatches are gone
- the admin area no longer feels like a mix of finished and unfinished screens

## What Should Explicitly Wait Until Later

Do **not** start these too early:

### 1. Deep extension-driven admin pages

Do this only after:

- admin sidebar registry exists
- `/admin/:slug` parity is in place

### 2. Heavy visual polish on partial pages

Do this only after:

- shared admin page frame exists
- overlay model exists

### 3. Rewriting the current config forms

Do this only if needed.

The current config pages are already one of the strongest parts of the React admin implementation.

## Cleanest Delivery Milestones

If you want to split the work into reviewable chunks, use these milestones:

### Milestone 1

Admin shell parity:

- admin sidebar
- system config grouping
- shared admin route metadata

### Milestone 2

Top-level page parity:

- overview
- organizations
- branding
- 2FA
- schedule monitor

### Milestone 3

Nested admin overlays:

- organization users
- schedule logs

### Milestone 4

Config structure + virtual route parity:

- `/admin/config`
- `/admin/:slug`
- admin registry integration

### Milestone 5

Runtime panels + final polish:

- extension-driven admin panels
- visual parity pass

## Fastest Path To Visible Progress

If the goal is to make the React admin look closer to Ember as fast as possible, the shortest high-impact path is:

1. Phase 1
2. Phase 3
3. Phase 4
4. Phase 6
5. Phase 8

This order gives the best visible improvement quickly because:

- sidebar parity changes the whole admin area at once
- top-level page parity improves the most frequently visited screens
- overlay parity makes the admin flows feel more enterprise
- dynamic admin parity unlocks future extension work

## Final Recommendation

The correct implementation order is:

1. **Admin shell foundation**
2. **Admin page frame parity**
3. **Core page surface parity**
4. **Nested overlay parity**
5. **Config route structure parity**
6. **Dynamic admin registry and virtual route parity**
7. **Runtime admin panels**
8. **Final visual and interaction parity**

This is the cleanest order because it follows dependency flow:

- shell before pages
- parent pages before child overlays
- static admin parity before dynamic admin parity
- structure before polish

