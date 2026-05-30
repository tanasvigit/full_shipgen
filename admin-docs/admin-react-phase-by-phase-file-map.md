# React Admin Phase-By-Phase File Map

This document turns the admin parity roadmap into a concrete file plan.

For each phase, it lists:

- existing files to edit
- new files to create
- why those files belong in that phase

The goal is to reduce guesswork before implementation starts.

## Scope

This file map assumes work happens inside `react-console/src`.

It is based on the current React structure already present:

- `layout/AppLayout.tsx`
- `layouts/AppShell.tsx`
- `layouts/SidebarHost.tsx`
- `layouts/TopHeader.tsx`
- `layouts/RightPanel.tsx`
- `pages/Admin*.tsx`
- `pages/Schedule*.tsx`
- `pages/VirtualPage.tsx`
- `store/uiStore.ts`
- `components/ui/Overlays.tsx`

## Phase 1. Admin Shell Foundation

### Edit

- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/store/uiStore.ts`
- `react-console/src/index.css`

### Create

- `react-console/src/registry/adminRegistry.ts`
- `react-console/src/modules/admin/sidebar/AdminSidebar.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebarSection.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebarItem.tsx`
- `react-console/src/modules/admin/sidebar/useAdminSidebar.ts`
- `react-console/src/modules/admin/shared/types.ts`
- `react-console/src/modules/admin/admin.css`

### Why these files

- `SidebarHost.tsx` is the current sidebar entry point, so it must become admin-aware.
- `AppShell.tsx` controls the shell composition and current sidebar mode behavior.
- `TopHeader.tsx` may need small adjustments so admin routes and header density work cleanly with the admin sidebar.
- `uiStore.ts` may need admin-specific sidebar or overlay state.
- `index.css` is where the global shell styling already lives.
- `adminRegistry.ts` should become the source of truth for core admin items and grouped config items.
- `modules/admin/sidebar/*` keeps admin navigation logic out of generic layout files.
- `modules/admin/admin.css` avoids overloading `index.css` with every admin-specific rule.

## Phase 2. Admin Page Frame Parity

### Edit

- `react-console/src/index.css`
- `react-console/src/modules/admin/admin.css`
- `react-console/src/pages/AdminOverviewPage.tsx`
- `react-console/src/pages/AdminOrganizationsPage.tsx`
- `react-console/src/pages/AdminBrandingPage.tsx`
- `react-console/src/pages/AdminTwoFaSettingsPage.tsx`
- `react-console/src/pages/ScheduleMonitorPage.tsx`
- `react-console/src/pages/AdminDatabaseConfigPage.tsx`
- `react-console/src/pages/AdminCacheConfigPage.tsx`
- `react-console/src/pages/AdminFilesystemConfigPage.tsx`
- `react-console/src/pages/AdminMailConfigPage.tsx`
- `react-console/src/pages/AdminQueueConfigPage.tsx`
- `react-console/src/pages/AdminServicesConfigPage.tsx`
- `react-console/src/pages/AdminPushNotificationsConfigPage.tsx`
- `react-console/src/pages/AdminSocketConfigPage.tsx`

### Create

- `react-console/src/modules/admin/layout/AdminPageFrame.tsx`
- `react-console/src/modules/admin/layout/AdminPageHeader.tsx`
- `react-console/src/modules/admin/layout/AdminSection.tsx`
- `react-console/src/modules/admin/layout/AdminTableShell.tsx`
- `react-console/src/modules/admin/layout/AdminEmptyState.tsx`
- `react-console/src/modules/admin/layout/AdminStatusMessage.tsx`

### Why these files

- The current admin pages do not share a dedicated admin frame yet.
- A shared admin layout module lets the page surfaces converge before deeper page-specific work begins.
- The config pages should also use the same frame so the entire admin area reads as one system.

## Phase 3. Core Page Surface Parity

### Edit

- `react-console/src/pages/AdminOverviewPage.tsx`
- `react-console/src/pages/AdminOrganizationsPage.tsx`
- `react-console/src/pages/AdminBrandingPage.tsx`
- `react-console/src/pages/AdminTwoFaSettingsPage.tsx`
- `react-console/src/pages/ScheduleMonitorPage.tsx`
- `react-console/src/modules/admin/admin.css`

### Create

- `react-console/src/modules/admin/overview/AdminOverviewStats.tsx`
- `react-console/src/modules/admin/organizations/AdminOrganizationsTable.tsx`
- `react-console/src/modules/admin/organizations/AdminOrganizationsFilters.tsx`
- `react-console/src/modules/admin/branding/AdminBrandingForm.tsx`
- `react-console/src/modules/admin/two-fa/AdminTwoFaForm.tsx`
- `react-console/src/modules/admin/schedule-monitor/ScheduleMonitorTable.tsx`

### Why these files

- These five pages are the highest-value top-level parity pages.
- Splitting them into feature-specific admin subcomponents avoids growing large page files.
- `AdminOrganizationsPage.tsx` and `ScheduleMonitorPage.tsx` are especially likely to need dedicated table/filter components.

## Phase 4. Nested Overlay Parity

### Edit

- `react-console/src/pages/AdminOrganizationUsersPage.tsx`
- `react-console/src/pages/ScheduleLogsPage.tsx`
- `react-console/src/layouts/RightPanel.tsx`
- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/store/uiStore.ts`
- `react-console/src/components/ui/Overlays.tsx`
- `react-console/src/modules/admin/admin.css`

### Create

- `react-console/src/modules/admin/overlays/AdminDetailOverlay.tsx`
- `react-console/src/modules/admin/overlays/AdminDetailOverlayHeader.tsx`
- `react-console/src/modules/admin/overlays/useAdminDetailRoute.ts`
- `react-console/src/modules/admin/organizations/AdminOrganizationUsersTable.tsx`
- `react-console/src/modules/admin/schedule-monitor/ScheduleLogList.tsx`

### Why these files

- `AdminOrganizationUsersPage.tsx` and `ScheduleLogsPage.tsx` already exist, but they need to move from plain routed-page behavior to admin overlay behavior.
- `RightPanel.tsx` is the current shell-level side panel placeholder and is the most obvious place to connect a real admin detail panel system.
- `Overlays.tsx` may need small upgrades for Ember-like right-side admin detail behavior.
- The admin overlay shell should be reusable rather than duplicated between users and logs.

## Phase 5. Config Route Structure Parity

### Edit

- `react-console/src/App.tsx`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/registry/adminRegistry.ts`
- `react-console/src/pages/AdminDatabaseConfigPage.tsx`
- `react-console/src/pages/AdminCacheConfigPage.tsx`
- `react-console/src/pages/AdminFilesystemConfigPage.tsx`
- `react-console/src/pages/AdminMailConfigPage.tsx`
- `react-console/src/pages/AdminQueueConfigPage.tsx`
- `react-console/src/pages/AdminServicesConfigPage.tsx`
- `react-console/src/pages/AdminPushNotificationsConfigPage.tsx`
- `react-console/src/pages/AdminSocketConfigPage.tsx`
- `react-console/src/modules/admin/admin.css`

### Create

- `react-console/src/pages/AdminConfigPage.tsx`
- `react-console/src/modules/admin/config/AdminConfigLanding.tsx`
- `react-console/src/modules/admin/config/AdminConfigGroup.tsx`
- `react-console/src/modules/admin/config/useAdminConfigNavigation.ts`

### Why these files

- `/admin/config` should stop being a generic JSON editor and become a true admin config section entry.
- `App.tsx` must be updated because the current route points directly to `AdminConfigEditorPage`.
- The existing config pages are worth keeping, but they need to sit inside a more Ember-like config structure.

## Phase 6. Dynamic Admin Registry And Virtual Route Parity

### Edit

- `react-console/src/pages/VirtualPage.tsx`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/registry/adminRegistry.ts`
- `react-console/src/modules/admin/sidebar/useAdminSidebar.ts`
- `react-console/src/modules/admin/shared/types.ts`
- `react-console/src/index.css`

### Create

- `react-console/src/modules/admin/virtual/AdminVirtualPage.tsx`
- `react-console/src/modules/admin/virtual/AdminVirtualPageHeader.tsx`
- `react-console/src/modules/admin/virtual/resolveAdminVirtualRoute.ts`
- `react-console/src/modules/admin/registry/adminRuntimeRegistry.ts`

### Why these files

- `VirtualPage.tsx` currently handles multiple route scopes generically.
- Admin scope should become a first-class case rather than just another branch inside a generic virtual page.
- A dedicated admin runtime registry layer is needed before runtime admin panels can be supported cleanly.

## Phase 7. Runtime Admin Panels

### Edit

- `react-console/src/registry/adminRegistry.ts`
- `react-console/src/modules/admin/registry/adminRuntimeRegistry.ts`
- `react-console/src/modules/admin/sidebar/AdminSidebar.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebarSection.tsx`
- `react-console/src/modules/admin/sidebar/useAdminSidebar.ts`
- `react-console/src/pages/VirtualPage.tsx`
- `react-console/src/modules/admin/admin.css`

### Create

- `react-console/src/modules/admin/panels/AdminRuntimePanel.tsx`
- `react-console/src/modules/admin/panels/AdminRuntimePanelGroup.tsx`
- `react-console/src/modules/admin/panels/useAdminRuntimePanels.ts`

### Why these files

- This phase is about representing grouped runtime admin panels such as `Fleet-Ops Config` and `Extensions Registry`.
- The sidebar and registry layers must both be extended, but the UI should still stay modular inside `modules/admin/panels/`.

## Phase 8. Final Visual And Interaction Parity Pass

### Edit

- `react-console/src/index.css`
- `react-console/src/modules/admin/admin.css`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/layouts/RightPanel.tsx`
- `react-console/src/components/ui/Overlays.tsx`
- `react-console/src/pages/AdminOverviewPage.tsx`
- `react-console/src/pages/AdminOrganizationsPage.tsx`
- `react-console/src/pages/AdminOrganizationUsersPage.tsx`
- `react-console/src/pages/AdminBrandingPage.tsx`
- `react-console/src/pages/AdminTwoFaSettingsPage.tsx`
- `react-console/src/pages/ScheduleMonitorPage.tsx`
- `react-console/src/pages/ScheduleLogsPage.tsx`
- `react-console/src/pages/AdminDatabaseConfigPage.tsx`
- `react-console/src/pages/AdminCacheConfigPage.tsx`
- `react-console/src/pages/AdminFilesystemConfigPage.tsx`
- `react-console/src/pages/AdminMailConfigPage.tsx`
- `react-console/src/pages/AdminQueueConfigPage.tsx`
- `react-console/src/pages/AdminServicesConfigPage.tsx`
- `react-console/src/pages/AdminPushNotificationsConfigPage.tsx`
- `react-console/src/pages/AdminSocketConfigPage.tsx`
- `react-console/src/pages/VirtualPage.tsx`

### Create

- no required new files in this phase

### Why these files

- This phase should mostly be refinement, not architecture.
- By the time this phase starts, the necessary admin files should already exist.
- The focus here is consistency, spacing, density, overlay polish, and removing the last obvious parity gaps.

## Files That Should Usually Stay Stable

These should not need major admin-parity rewrites:

- `react-console/src/layout/AppLayout.tsx`
- `react-console/src/pages/AdminNotificationsPage.tsx`

### Why

- `AppLayout.tsx` is already just a thin shell wrapper.
- `AdminNotificationsPage.tsx` is a React-only admin addition and is not part of the core Ember admin parity target.

## Minimum New Folder Structure

If you want the admin work to stay organized, this is the smallest clean module structure to add:

```text
react-console/src/modules/admin/
├── admin.css
├── shared/
│   └── types.ts
├── sidebar/
│   ├── AdminSidebar.tsx
│   ├── AdminSidebarSection.tsx
│   ├── AdminSidebarItem.tsx
│   └── useAdminSidebar.ts
├── layout/
│   ├── AdminPageFrame.tsx
│   ├── AdminPageHeader.tsx
│   ├── AdminSection.tsx
│   ├── AdminTableShell.tsx
│   ├── AdminEmptyState.tsx
│   └── AdminStatusMessage.tsx
├── config/
│   ├── AdminConfigLanding.tsx
│   ├── AdminConfigGroup.tsx
│   └── useAdminConfigNavigation.ts
├── overlays/
│   ├── AdminDetailOverlay.tsx
│   ├── AdminDetailOverlayHeader.tsx
│   └── useAdminDetailRoute.ts
├── virtual/
│   ├── AdminVirtualPage.tsx
│   ├── AdminVirtualPageHeader.tsx
│   └── resolveAdminVirtualRoute.ts
├── registry/
│   └── adminRuntimeRegistry.ts
├── panels/
│   ├── AdminRuntimePanel.tsx
│   ├── AdminRuntimePanelGroup.tsx
│   └── useAdminRuntimePanels.ts
├── overview/
│   └── AdminOverviewStats.tsx
├── organizations/
│   ├── AdminOrganizationsFilters.tsx
│   ├── AdminOrganizationsTable.tsx
│   └── AdminOrganizationUsersTable.tsx
├── branding/
│   └── AdminBrandingForm.tsx
├── two-fa/
│   └── AdminTwoFaForm.tsx
└── schedule-monitor/
    ├── ScheduleMonitorTable.tsx
    └── ScheduleLogList.tsx
```

## Fastest First Implementation Set

If you want the smallest high-impact first wave, start with only these files:

### Edit first

- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/store/uiStore.ts`
- `react-console/src/index.css`

### Create first

- `react-console/src/registry/adminRegistry.ts`
- `react-console/src/modules/admin/sidebar/AdminSidebar.tsx`
- `react-console/src/modules/admin/sidebar/AdminSidebarSection.tsx`
- `react-console/src/modules/admin/sidebar/useAdminSidebar.ts`
- `react-console/src/modules/admin/admin.css`

That first wave is the cleanest place to begin because it unlocks the rest of the admin work without forcing later rewrites.

