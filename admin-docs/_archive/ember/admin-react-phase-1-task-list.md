# React Admin Phase 1 Task List

This document turns **Phase 1: Admin Shell Foundation** into a direct implementation checklist.

Use this as the working checklist before starting any deeper admin page parity work.

## Phase 1 Goal

Make `/admin/**` feel like a real Ember-style admin area by adding:

- admin-aware sidebar behavior
- grouped admin navigation
- registry-driven admin route metadata
- basic admin shell styling and layout consistency

This phase is **not** for:

- deep page redesign
- nested overlays
- dynamic runtime admin panels
- heavy visual polish

## Required Outcomes

By the end of Phase 1:

1. `/admin/**` shows a dedicated admin sidebar
2. core admin routes are reachable from the sidebar
3. `System Config` appears as a grouped admin section
4. admin navigation is registry-driven
5. the current non-admin sidebar behavior still works

## Files In Scope

### Edit

- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/store/uiStore.ts`
- `react-console/src/index.css`

### Create

- `react-console/src/registry/adminRegistry.ts`
- `react-console/src/modules/admin/shared/types.ts`
- `react-console/src/modules/admin/sidebar/AdminSidebar.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebarSection.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebarItem.tsx`
- `react-console/src/modules/admin/sidebar/useAdminSidebar.ts`
- `react-console/src/modules/admin/admin.css`

## Up-Front Decisions

Make these decisions before coding too far:

### 1. Database and Cache visibility

Choose one:

- `Option A`: keep `Database` and `Cache` as valid routes but hide them from the default sidebar
- `Option B`: include `Database` and `Cache` inside the `System Config` sidebar group

Recommended for parity:

- `Option A`

### 2. Sidebar expansion behavior

Choose one:

- `Option A`: `System Config` always expanded on admin routes
- `Option B`: `System Config` collapsible with local persistence

Recommended for Phase 1:

- `Option A`

Keep it simple first. Collapsible admin groups can come later if needed.

### 3. Admin registry location

Choose one source of truth:

- single file: `react-console/src/registry/adminRegistry.ts`
- split registry across sidebar components

Recommended:

- single file registry

## Ordered Task List

## Task 1. Define admin route metadata types

### Create

- `react-console/src/modules/admin/shared/types.ts`

### Add

Types for:

- admin item
- admin group
- admin section
- admin route metadata
- item visibility mode

### Minimum shape

The types should support:

- `id`
- `label`
- `route`
- `kind`
- `group`
- `visibleInSidebar`
- `children`

### Done when

- all admin sidebar data can be typed without `any`
- both standalone items and grouped items are supported

## Task 2. Create the admin registry

### Create

- `react-console/src/registry/adminRegistry.ts`

### Add

Core root admin items:

- Overview
- Organizations
- Branding
- 2FA Config
- Schedule Monitor

Grouped config items:

- Services
- Mail
- Filesystem
- Queue
- Socket
- Push Notifications

Optional route-backed but hidden items depending on decision:

- Database
- Cache

### Registry should expose

- full admin navigation tree
- flat list lookup by route or id
- helpers for matching current pathname

### Done when

- admin sidebar content no longer needs hardcoded link arrays
- core admin navigation exists in one source of truth

## Task 3. Build admin sidebar item components

### Create

- `react-console/src/modules/admin/sidebar/AdminSidebarItem.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebarSection.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebar.tsx`

### Build

`AdminSidebarItem.tsx`

- render a single admin nav item
- support active state
- support nested indentation when needed

`AdminSidebarSection.tsx`

- render a section title or grouped block
- render child items

`AdminSidebar.tsx`

- render the full admin sidebar from the registry
- support the built-in admin structure

### Done when

- the admin sidebar can be rendered without using `SidebarHost.tsx` route arrays
- the `System Config` group is shown in the sidebar UI

## Task 4. Add admin sidebar hook

### Create

- `react-console/src/modules/admin/sidebar/useAdminSidebar.ts`

### Add

Logic for:

- detecting whether current route is under `/admin`
- resolving active admin item
- exposing sidebar sections/items

### Done when

- `SidebarHost.tsx` can consume one admin-specific hook instead of building admin state inline

## Task 5. Upgrade `SidebarHost.tsx` to support admin mode

### Edit

- `react-console/src/layouts/SidebarHost.tsx`

### Change

Current behavior only supports:

- profile
- settings
- customization

Add:

- `/admin/**` detection
- render `AdminSidebar` when in admin routes
- preserve current behavior for non-admin routes

### Important rule

Do **not** break existing profile/settings/customization sidebars.

### Done when

- `/admin`, `/admin/organizations`, `/admin/config/services`, etc. all show admin sidebar content
- `/profile`, `/settings`, `/customization` still behave as before

## Task 6. Adjust shell behavior for admin routes

### Edit

- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/store/uiStore.ts`

### Review and update

1. sidebar mode defaults on admin routes
2. whether admin routes should force expanded sidebar
3. whether admin routes need a stable sidebar width

### Recommended Phase 1 behavior

- admin routes should prefer expanded sidebar
- avoid admin sidebar collapsing into a rail by default

### Done when

- admin routes do not feel like they are borrowing the homepage shell behavior
- sidebar state supports the admin use case cleanly

## Task 7. Make small header adjustments for admin context

### Edit

- `react-console/src/layouts/TopHeader.tsx`

### Check for needed adjustments

- header density against admin sidebar
- nav alignment with admin routes
- whether homepage-style smart navigation competes visually with admin context

### Phase 1 rule

Only make light header adjustments here.

Do **not** redesign the header in this phase.

### Done when

- the admin area reads cleanly with the current shell
- there are no obvious layout clashes between header and admin sidebar

## Task 8. Add admin shell styling

### Create

- `react-console/src/modules/admin/admin.css`

### Edit

- `react-console/src/index.css`

### Add styles for

- admin sidebar width
- admin sidebar section headings
- admin sidebar item spacing
- grouped `System Config` presentation
- active item treatment
- admin route density

### Styling rule

Keep Phase 1 styling structural and stable.

Do **not** spend Phase 1 on high-detail polish.

### Done when

- admin sidebar looks intentional and structured
- grouped config items are visually distinct from top-level items

## Task 9. Wire stylesheet loading

### Edit

- whichever shared stylesheet entry currently imports module CSS, likely `src/index.css`

### Ensure

- `modules/admin/admin.css` is loaded
- admin-specific styling does not accidentally override unrelated shell areas

### Done when

- admin sidebar styles render on admin routes
- unrelated pages do not regress visually

## Task 10. Sanity-check the route map against the registry

### Edit if needed

- `react-console/src/App.tsx`

### Verify

The registry and actual React routes are aligned for:

- `/admin`
- `/admin/organizations`
- `/admin/branding`
- `/admin/two-fa-settings`
- `/admin/schedule-monitor`
- `/admin/config/services`
- `/admin/config/mail`
- `/admin/config/filesystem`
- `/admin/config/queue`
- `/admin/config/socket`
- `/admin/config/push-notifications`

### Phase 1 note

No major route rewrites are required here unless a mismatch is found.

### Done when

- every visible admin sidebar item points to a real existing route

## Suggested Implementation Order

If you want the most efficient coding order, do the tasks in this sequence:

1. Task 1: define types
2. Task 2: create admin registry
3. Task 3: build sidebar components
4. Task 4: build admin sidebar hook
5. Task 5: update `SidebarHost.tsx`
6. Task 6: adjust shell/sidebar store behavior
7. Task 8: add admin shell styling
8. Task 9: wire stylesheet loading
9. Task 7: small header adjustments
10. Task 10: route sanity check

## Manual Verification Checklist

Verify these routes manually after implementation:

- `/admin`
- `/admin/organizations`
- `/admin/branding`
- `/admin/two-fa-settings`
- `/admin/schedule-monitor`
- `/admin/config/services`
- `/admin/config/mail`
- `/admin/config/filesystem`
- `/admin/config/queue`
- `/admin/config/socket`
- `/admin/config/push-notifications`

For each route, confirm:

1. admin sidebar is visible
2. correct item is highlighted
3. `System Config` group appears correctly
4. sidebar does not fall back to profile/settings/customization content
5. main content still renders normally

Also verify these non-admin routes did not regress:

- `/profile`
- `/settings`
- `/customization`

## Definition Of Done

Phase 1 is complete when all of the following are true:

- admin sidebar exists
- admin sidebar is registry-driven
- admin routes render the correct core navigation
- `System Config` appears as a grouped admin section
- non-admin sidebar behavior still works
- admin shell styling is present and stable
- no admin route shown in the sidebar is broken

## Do Not Do In Phase 1

Avoid these during this phase:

- redesigning `AdminOverviewPage`
- redesigning `AdminOrganizationsPage`
- turning nested routes into overlays
- building `/admin/:slug` parity
- building runtime admin panels
- deep visual polish

Those belong to later phases and will cause rework if pulled forward too early.

## Best First Coding Slice

If you want the smallest useful first PR or work chunk, do only this:

### Create

- `react-console/src/modules/admin/shared/types.ts`
- `react-console/src/registry/adminRegistry.ts`
- `react-console/src/modules/admin/sidebar/AdminSidebar.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebarSection.tsx`
- `react-console/src/modules/admin/sidebar/useAdminSidebar.ts`
- `react-console/src/modules/admin/admin.css`

### Edit

- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/store/uiStore.ts`
- `react-console/src/index.css`

That slice is enough to unlock a real admin shell without dragging in later-phase work.

