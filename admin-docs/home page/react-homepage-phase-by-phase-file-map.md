# React Homepage Phase-By-Phase File Map

This document turns the homepage parity roadmap into a concrete file plan.

For each phase, it lists:

- existing files to edit
- new files to create
- why those files belong in that phase

The goal is to reduce guesswork before homepage implementation starts.

## Scope

This file map assumes work happens inside `react-console/src`.

It is based on the current homepage-related React structure already present:

- `layouts/AppShell.tsx`
- `layouts/SidebarHost.tsx`
- `layouts/TopHeader.tsx`
- `layouts/RightPanel.tsx`
- `pages/HomePage.tsx`
- `pages/VirtualPage.tsx`
- `pages/foundation/*.tsx`
- `components/portal/Portal.tsx`
- `modules/header/**`
- `modules/navigation/**`
- `modules/dashboard/**`
- `store/*.ts`
- `services/mock*.ts`
- `extensions/*.tsx`
- `lib/runtimeConfig.ts`
- `lib/extensions.ts`

## Phase 1. Homepage Shell Completion

### Edit

- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/RightPanel.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/pages/HomePage.tsx`
- `react-console/src/components/portal/Portal.tsx`
- `react-console/src/shared/foundationTypes.ts`
- `react-console/src/store/uiStore.ts`
- `react-console/src/index.css`

### Create

- `react-console/src/modules/home/shell/useHomeShellMode.ts`
- `react-console/src/modules/home/alerts/HomeTwoFaAlert.tsx`
- `react-console/src/modules/home/portal/HomePortalTargets.tsx`

### Why these files

- `AppShell.tsx` is the shell composition entry point, so homepage mode must be made explicit there instead of approximated through rail behavior alone.
- `SidebarHost.tsx` controls whether the home route truly hides the sidebar or only collapses it.
- `RightPanel.tsx` is the current placeholder for Ember’s richer context/resource area.
- `TopHeader.tsx` may need small adjustments once home shell mode and new portal targets are introduced.
- `HomePage.tsx` is where the home body can gain the missing 2FA alert region and cleaner shell-local composition.
- `Portal.tsx` and `foundationTypes.ts` must grow to support first-class home/header injection targets.
- `uiStore.ts` is the right place for shell-level route mode or mobile drawer state if needed.
- `modules/home/*` keeps homepage-only shell logic out of generic layout files.

## Phase 2. Header Destination Page Parity

### Edit

- `react-console/src/App.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/pages/foundation/NotificationsFoundationPage.tsx`
- `react-console/src/pages/foundation/ChatPage.tsx`
- `react-console/src/pages/foundation/ProfilePage.tsx`
- `react-console/src/pages/foundation/ExtensionsPage.tsx`
- `react-console/src/pages/foundation/CustomizationPage.tsx`
- `react-console/src/index.css`

### Create

- `react-console/src/modules/notifications/NotificationsCenter.tsx`
- `react-console/src/modules/chat/ChatWorkspace.tsx`
- `react-console/src/modules/profile/ProfileOverview.tsx`
- `react-console/src/modules/extensions/ExtensionsDirectory.tsx`
- `react-console/src/modules/navigation/customization/CustomizationWorkspace.tsx`

### Why these files

- The current destination pages already exist, but they are still foundation placeholders and should be upgraded instead of discarded blindly.
- `App.tsx` may need route cleanup if these pages stop behaving like temporary placeholders.
- `TopHeader.tsx` may need small link and close-before-navigation refinements so the tray/menu flow matches the new pages.
- New feature-level modules allow the pages to stay thin while turning each destination into a real surface.

## Phase 3. Header Tray And Menu Behavior Parity

### Edit

- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/modules/header/languages/LanguagesTray.tsx`
- `react-console/src/modules/header/languages/useLanguagesTray.ts`
- `react-console/src/modules/header/languages/adapters.ts`
- `react-console/src/modules/header/notifications/NotificationsTray.tsx`
- `react-console/src/modules/header/notifications/useNotificationsTray.ts`
- `react-console/src/modules/header/chat/ChatDrawer.tsx`
- `react-console/src/modules/header/chat/useChatTray.ts`
- `react-console/src/modules/header/organization/OrganizationMenu.tsx`
- `react-console/src/modules/header/organization/useOrganizationMenu.ts`
- `react-console/src/modules/header/organization/adapters.ts`
- `react-console/src/modules/header/profile/ProfileMenu.tsx`
- `react-console/src/modules/header/profile/useProfileMenu.ts`
- `react-console/src/modules/header/profile/adapters.ts`
- `react-console/src/modules/header/shared/useHeaderActionDispatcher.ts`
- `react-console/src/store/currentUserStore.ts`
- `react-console/src/store/notificationStore.ts`
- `react-console/src/store/chatStore.ts`
- `react-console/src/services/mockUserService.ts`
- `react-console/src/services/mockNotificationService.ts`
- `react-console/src/services/mockChatService.ts`

### Create

- `react-console/src/modules/header/organization/OrganizationCreateJoinModal.tsx`
- `react-console/src/modules/header/organization/OrganizationMenuSections.tsx`
- `react-console/src/modules/header/profile/ProfileMenuSections.tsx`
- `react-console/src/modules/header/notifications/useNotificationEvents.ts`
- `react-console/src/modules/header/chat/chatSurfaceTypes.ts`

### Why these files

- This phase is about making the tray and menu behavior feel less mock-demo driven without yet doing full backend integration.
- `useHeaderActionDispatcher.ts` is the central place to remove fake placeholder handling and replace it with real routed or modal-backed flows.
- `notificationStore.ts` and `chatStore.ts` should become closer to event-ready state models even if the app is still mocked.
- Small helper files for menu sections and event/state contracts keep the large tray/menu components from becoming unmanageable.

## Phase 4. Smart Navigation Runtime Parity

### Edit

- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/modules/header/useHeaderBootstrap.ts`
- `react-console/src/registry/navigationRegistry.ts`
- `react-console/src/store/navigationStore.ts`
- `react-console/src/store/extensionStore.ts`
- `react-console/src/modules/navigation/smart-nav/useSmartNavigation.ts`
- `react-console/src/modules/navigation/smart-nav/SmartNavigationBar.tsx`
- `react-console/src/modules/navigation/extensions/ExtensionLauncher.tsx`
- `react-console/src/modules/navigation/command-grid/SearchableCommandGrid.tsx`
- `react-console/src/modules/navigation/customization/NavigationCustomizationModal.tsx`
- `react-console/src/services/mockExtensionService.ts`
- `react-console/src/index.css`

### Create

- `react-console/src/modules/navigation/runtime/resolveHeaderNavigation.ts`
- `react-console/src/modules/navigation/runtime/navigationPermissions.ts`
- `react-console/src/modules/navigation/runtime/navigationPersistence.ts`
- `react-console/src/modules/navigation/runtime/navigationTypes.ts`

### Why these files

- `useHeaderBootstrap.ts` is where the current mostly static header item composition begins, so it must be reworked into a runtime-driven source.
- `navigationStore.ts` currently mixes persistence and resolved item concerns; this phase should separate those concerns cleanly.
- `SmartNavigationBar.tsx`, launcher, command grid, and customization modal should all consume one resolved navigation graph.
- A dedicated `runtime/` submodule keeps the smart-nav parity logic isolated from raw UI rendering.

## Phase 5. Runtime Extension And Injection Parity

### Edit

- `react-console/src/lib/runtimeConfig.ts`
- `react-console/src/lib/extensions.ts`
- `react-console/src/pages/VirtualPage.tsx`
- `react-console/src/extensions/host.tsx`
- `react-console/src/extensions/registry.tsx`
- `react-console/src/components/portal/Portal.tsx`
- `react-console/src/store/extensionStore.ts`
- `react-console/src/modules/header/useHeaderBootstrap.ts`
- `react-console/src/modules/navigation/runtime/resolveHeaderNavigation.ts`

### Create

- `react-console/src/modules/home/runtime/homeRuntimeRegistry.ts`
- `react-console/src/modules/header/runtime/headerRuntimeRegistry.ts`
- `react-console/src/modules/home/runtime/useHomeRuntimeSlots.ts`

### Why these files

- `runtimeConfig.ts` and `extensions.ts` already define the runtime entry point, so this phase should extend them instead of inventing a second runtime system.
- `VirtualPage.tsx`, `extensions/host.tsx`, and `extensions/registry.tsx` are where route-level runtime behavior already exists.
- The missing piece is shell-level runtime influence, so new runtime registries for home/header surfaces make that behavior first-class.
- `Portal.tsx` needs to participate because injection parity is impossible without strong portal targets.

## Phase 6. Dashboard Service And Widget Parity

### Edit

- `react-console/src/pages/HomePage.tsx`
- `react-console/src/modules/dashboard/HomeDashboard.tsx`
- `react-console/src/store/dashboardStore.ts`
- `react-console/src/services/mockDashboardService.ts`
- `react-console/src/modules/dashboard/selector/DashboardSelector.tsx`
- `react-console/src/modules/dashboard/actions/DashboardActionsMenu.tsx`
- `react-console/src/modules/dashboard/layouts/DashboardGrid.tsx`
- `react-console/src/modules/dashboard/editing/useDashboardEditing.ts`
- `react-console/src/modules/dashboard/widget-picker/WidgetPickerModal.tsx`
- `react-console/src/modules/dashboard/registry/widgetRegistry.tsx`
- `react-console/src/modules/dashboard/shared/resolveDashboardExtension.ts`
- `react-console/src/modules/dashboard/widgets/MockWidgets.tsx`

### Create

- `react-console/src/modules/dashboard/service/dashboardRuntimeRegistry.ts`
- `react-console/src/modules/dashboard/service/useDashboardRuntime.ts`
- `react-console/src/modules/dashboard/actions/CreateDashboardModal.tsx`
- `react-console/src/modules/dashboard/registry/resolveRegisteredWidgets.ts`

### Why these files

- `HomeDashboard.tsx` is the core orchestrator and should stay the integration point.
- `dashboardStore.ts` and `mockDashboardService.ts` are the current service boundary and must be upgraded, not bypassed.
- `DashboardActionsMenu.tsx` needs a clean place to add the missing create-dashboard flow.
- `widgetRegistry.tsx` should evolve toward runtime-friendly widget resolution rather than staying a purely static list.
- The existing grid, editing, and picker modules should be preserved and upgraded rather than replaced.

## Phase 7. Mobile Shell And Global Chat Surface Parity

### Edit

- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/pages/HomePage.tsx`
- `react-console/src/modules/header/chat/ChatDrawer.tsx`
- `react-console/src/modules/header/chat/useChatTray.ts`
- `react-console/src/store/chatStore.ts`
- `react-console/src/store/uiStore.ts`
- `react-console/src/index.css`

### Create

- `react-console/src/modules/mobile/MobileHomeNavbar.tsx`
- `react-console/src/modules/header/chat/ChatWindowHost.tsx`
- `react-console/src/modules/header/chat/FloatingChatWindow.tsx`
- `react-console/src/modules/session/ImpersonatorTray.tsx`

### Why these files

- `AppShell.tsx` is where mobile shell composition and shell-level chat surfaces belong.
- `TopHeader.tsx` must coordinate with any new mobile navbar behavior and chat-host triggers.
- `ChatDrawer.tsx` and `useChatTray.ts` should become one part of a broader chat surface system instead of the whole system.
- New shell-level chat modules keep persistent chat windows separate from the drawer implementation.
- `ImpersonatorTray.tsx` is listed here because it is a shell-level parity item, not a dashboard or tray-level concern.

## Phase 8. Final Visual And Interaction Parity Pass

### Edit

- `react-console/src/index.css`
- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/layouts/RightPanel.tsx`
- `react-console/src/pages/HomePage.tsx`
- `react-console/src/components/portal/Portal.tsx`
- `react-console/src/modules/header/**`
- `react-console/src/modules/navigation/**`
- `react-console/src/modules/dashboard/**`
- `react-console/src/modules/mobile/**`

### Create

- no required new files in this phase

### Why these files

- This phase should mostly be refinement, not architecture.
- By the time this phase starts, the necessary homepage files should already exist.
- The focus here is consistency, density, alignment, motion timing, empty-state wording, and removing the last obvious parity gaps.

## Files That Should Usually Stay Stable

These should not need major homepage-parity rewrites:

- `react-console/src/layout/AppLayout.tsx`
- `react-console/src/modules/dashboard/layouts/*` except for targeted dashboard parity refinements

### Why

- `AppLayout.tsx` is already just a thin shell wrapper.
- Most of the dashboard layout foundation already exists and should be upgraded rather than structurally replaced.

## Minimum New Folder Structure

If you want the homepage work to stay organized, this is the smallest clean module structure to add:

```text
react-console/src/modules/
├── home/
│   ├── alerts/
│   │   └── HomeTwoFaAlert.tsx
│   ├── portal/
│   │   └── HomePortalTargets.tsx
│   ├── runtime/
│   │   ├── homeRuntimeRegistry.ts
│   │   └── useHomeRuntimeSlots.ts
│   └── shell/
│       └── useHomeShellMode.ts
├── notifications/
│   └── NotificationsCenter.tsx
├── chat/
│   └── ChatWorkspace.tsx
├── profile/
│   └── ProfileOverview.tsx
├── extensions/
│   └── ExtensionsDirectory.tsx
├── mobile/
│   └── MobileHomeNavbar.tsx
├── session/
│   └── ImpersonatorTray.tsx
├── header/
│   ├── runtime/
│   │   └── headerRuntimeRegistry.ts
│   ├── chat/
│   │   ├── ChatWindowHost.tsx
│   │   ├── FloatingChatWindow.tsx
│   │   └── chatSurfaceTypes.ts
│   ├── notifications/
│   │   └── useNotificationEvents.ts
│   ├── organization/
│   │   ├── OrganizationCreateJoinModal.tsx
│   │   └── OrganizationMenuSections.tsx
│   └── profile/
│       └── ProfileMenuSections.tsx
├── navigation/
│   └── runtime/
│       ├── navigationPermissions.ts
│       ├── navigationPersistence.ts
│       ├── navigationTypes.ts
│       └── resolveHeaderNavigation.ts
└── dashboard/
    ├── service/
    │   ├── dashboardRuntimeRegistry.ts
    │   └── useDashboardRuntime.ts
    ├── actions/
    │   └── CreateDashboardModal.tsx
    └── registry/
        └── resolveRegisteredWidgets.ts
```

## Fastest First Implementation Set

If you want the smallest high-impact first wave, start with only these files:

### Edit first

- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/RightPanel.tsx`
- `react-console/src/pages/HomePage.tsx`
- `react-console/src/components/portal/Portal.tsx`
- `react-console/src/store/uiStore.ts`
- `react-console/src/index.css`

### Create first

- `react-console/src/modules/home/shell/useHomeShellMode.ts`
- `react-console/src/modules/home/alerts/HomeTwoFaAlert.tsx`
- `react-console/src/modules/home/portal/HomePortalTargets.tsx`

That first wave is the cleanest place to begin because it unlocks the rest of the homepage work without forcing later rewrites.
