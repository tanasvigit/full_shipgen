# React Homepage Phase 1 Task List

This document turns **Phase 1: Homepage Shell Completion** into a direct implementation checklist.

Use this as the working checklist before starting any deeper homepage parity work.

## Phase 1 Goal

Make the React homepage shell feel more like the Ember homepage by adding:

- explicit homepage shell mode
- true homepage sidebar-hide behavior
- home 2FA alert support
- stronger home/header portal targets
- better shell-level right-side behavior

This phase is **not** for:

- rebuilding notifications, chat, profile, extensions, or customization pages
- deep tray/menu behavior parity
- smart navigation runtime parity
- dashboard service rewrites
- mobile shell parity
- final visual polish

## Required Outcomes

By the end of Phase 1:

1. homepage routes use a distinct shell mode rather than just borrowed rail behavior
2. the sidebar is truly suppressed on homepage-like routes
3. the home body can render a 2FA alert region
4. `console-home-wormhole` becomes part of the first-class portal model
5. header injection targets needed for later parity exist
6. the right-side shell behavior is more intentional on home routes
7. non-home routes still work as before

## Files In Scope

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

## Up-Front Decisions

Make these decisions before coding too far:

### 1. What counts as a homepage-like route

Choose one:

- `Option A`: only `/`
- `Option B`: `/` plus any route that should share the Ember home shell behavior, such as `/dashboard`

Recommended for Phase 1:

- `Option B`

That keeps shell behavior consistent if the app still exposes `/dashboard`.

### 2. Sidebar behavior on home routes

Choose one:

- `Option A`: fully remove the sidebar host from layout flow on home routes
- `Option B`: keep the sidebar mounted but visually collapsed

Recommended for parity:

- `Option A`

The Ember homepage is conceptually a hidden-sidebar mode, not just a compact rail.

### 3. Right panel behavior on home routes

Choose one:

- `Option A`: hide the current placeholder right panel on home routes until a real home context panel exists
- `Option B`: keep showing the placeholder panel

Recommended for Phase 1:

- `Option A`

The placeholder panel currently weakens parity more than it helps.

### 4. 2FA alert data source

Choose one:

- `Option A`: stub the alert behind a simple user/store flag
- `Option B`: build a deeper auth/settings dependency now

Recommended for Phase 1:

- `Option A`

The shell needs the alert region first. Deeper auth/settings behavior belongs later.

### 5. Portal target naming

Keep the naming aligned with Ember where possible:

- `application-root-wormhole`
- `console-wormhole`
- `view-header-actions`
- `view-header-left-content-a`
- `view-header-left-content-b`
- `console-home-wormhole`

Recommended:

- preserve Ember-style names exactly for future parity clarity

## Ordered Task List

## Task 1. Create homepage shell mode hook

### Create

- `react-console/src/modules/home/shell/useHomeShellMode.ts`

### Add

Logic for:

- detecting whether the current route is in homepage shell mode
- exposing booleans such as:
  - `isHomeShellRoute`
  - `hideSidebar`
  - `hideRightPanel`
  - `isDashboardLikeHomeRoute`

### Done when

- shell route decisions no longer need to be scattered across `AppShell.tsx`, `SidebarHost.tsx`, and `RightPanel.tsx`
- homepage route handling becomes explicit and reusable

## Task 2. Upgrade `AppShell.tsx` to use explicit homepage shell mode

### Edit

- `react-console/src/layouts/AppShell.tsx`

### Change

Replace indirect homepage behavior with explicit shell-mode handling:

1. consume `useHomeShellMode()`
2. stop relying on rail mode as the homepage approximation
3. ensure layout composition knows when the route is in home mode
4. pass clean shell intent down to child layout pieces if needed

### Done when

- `AppShell.tsx` clearly expresses home vs non-home shell behavior
- homepage shell intent is readable from one place

## Task 3. Make `SidebarHost.tsx` truly suppress the sidebar on home routes

### Edit

- `react-console/src/layouts/SidebarHost.tsx`

### Change

1. use home shell mode detection
2. remove the sidebar from layout flow on home routes
3. preserve current sidebar behavior for:
   - profile
   - settings
   - customization
   - admin
   - other non-home routes

### Important rule

Do **not** break current non-home sidebar behavior.

### Done when

- `/` does not behave like a rail-sidebar page anymore
- non-home routes still render their current sidebars correctly

## Task 4. Make `RightPanel.tsx` intentional for home routes

### Edit

- `react-console/src/layouts/RightPanel.tsx`

### Change

1. use the same home shell mode source
2. hide the current placeholder panel on home routes
3. keep current right-panel behavior unchanged elsewhere unless a clear route bug is found

### Done when

- the homepage no longer shows a shell-level placeholder that conflicts with Ember parity
- non-home routes are not accidentally broken

## Task 5. Add the homepage 2FA alert surface

### Create

- `react-console/src/modules/home/alerts/HomeTwoFaAlert.tsx`

### Edit

- `react-console/src/pages/HomePage.tsx`
- `react-console/src/store/currentUserStore.ts` if a small stub flag is needed

### Build

`HomeTwoFaAlert.tsx` should:

- render only when the relevant user/store flag requires it
- stay visually lightweight and structural in Phase 1
- reserve the correct location above the dashboard body

`HomePage.tsx` should:

- render `HomeTwoFaAlert`
- keep `HomeDashboard`
- keep the home wormhole target

### Done when

- the home page body structure is closer to Ember:
  - 2FA alert area
  - dashboard body
  - home injection area

## Task 6. Promote home and header injection targets into the portal system

### Edit

- `react-console/src/components/portal/Portal.tsx`
- `react-console/src/shared/foundationTypes.ts`
- `react-console/src/pages/HomePage.tsx`

### Create

- `react-console/src/modules/home/portal/HomePortalTargets.tsx`

### Add

Support for:

- `view-header-left-content-a`
- `view-header-left-content-b`
- `console-home-wormhole`

### Important rule

Do **not** leave `console-home-wormhole` as a special raw DOM target if the rest of the shell uses typed portal targets.

### Done when

- all major header/home injection targets are first-class portal targets
- future shell/runtime work can target them cleanly

## Task 7. Make small header adjustments for new portal targets and home shell mode

### Edit

- `react-console/src/layouts/TopHeader.tsx`

### Check for needed adjustments

- whether new header-left portal targets are rendered in stable positions
- whether home shell mode affects header spacing or trigger grouping
- whether the header still reads cleanly with the sidebar removed

### Phase 1 rule

Only make light structural header adjustments here.

Do **not** redesign tray behavior or smart navigation in this phase.

### Done when

- the header has the necessary injection targets
- the homepage header still feels stable after the shell change

## Task 8. Add shell-level state support if needed

### Edit

- `react-console/src/store/uiStore.ts`

### Add only if useful

- homepage shell mode state helpers
- shell-level visibility flags that do not belong in component-local state
- future-safe mobile/home shell flags if they directly support Phase 1

### Phase 1 rule

Do not over-model this.

If a route-derived hook is enough, keep the store light.

### Done when

- shell state is clear and not duplicated awkwardly across layout files

## Task 9. Add homepage shell styling

### Edit

- `react-console/src/index.css`

### Add styles for

- hidden-home sidebar layout behavior
- home body spacing once the 2FA alert is added
- home/header injection target stability if needed
- right-panel suppression on home routes if layout classes require it

### Styling rule

Keep Phase 1 styling structural and stable.

Do **not** spend Phase 1 on high-detail homepage polish.

### Done when

- the homepage layout looks intentional after shell changes
- no obvious spacing collapse or layout gaps appear

## Task 10. Sanity-check route coverage and shell behavior

### Edit if needed

- `react-console/src/App.tsx`

### Verify

That homepage shell behavior is correct for:

- `/`
- `/dashboard` if it is intentionally treated as a home-shell route

Also verify that non-home shell behavior still works for:

- `/profile`
- `/settings`
- `/customization`
- `/admin`

### Phase 1 note

No major route rewrites are required here unless a shell-mode mismatch is found.

### Done when

- the homepage shell behavior is applied only where intended
- non-home routes do not accidentally inherit homepage shell rules

## Suggested Implementation Order

If you want the most efficient coding order, do the tasks in this sequence:

1. Task 1: create home shell mode hook
2. Task 2: update `AppShell.tsx`
3. Task 3: update `SidebarHost.tsx`
4. Task 4: update `RightPanel.tsx`
5. Task 6: promote portal targets
6. Task 5: add `HomeTwoFaAlert` and update `HomePage.tsx`
7. Task 7: small header adjustments
8. Task 8: add shell-level store support only if needed
9. Task 9: add shell styling
10. Task 10: route and behavior sanity check

## Manual Verification Checklist

Verify these routes manually after implementation:

- `/`
- `/dashboard` if it still intentionally shares home shell mode

For each home-shell route, confirm:

1. sidebar is not shown
2. homepage header still renders correctly
3. right panel placeholder is not visible
4. 2FA alert region can render without breaking layout
5. dashboard still renders normally
6. `console-home-wormhole` target still exists
7. header-left portal targets exist

Also verify these non-home routes did not regress:

- `/profile`
- `/settings`
- `/customization`
- `/admin`

For each non-home route, confirm:

1. existing sidebar behavior still works
2. layout width is not broken
3. right panel behavior is unchanged unless intentionally improved

## Definition Of Done

Phase 1 is complete when all of the following are true:

- homepage shell mode exists as an explicit concept
- sidebar is truly hidden on homepage shell routes
- right-panel placeholder is not weakening the homepage shell
- home page can render a 2FA alert area
- home/header portal targets are first-class and stable
- non-home routes still behave correctly
- the homepage shell structure is closer to Ember even before deeper feature work begins

## Do Not Do In Phase 1

Avoid these during this phase:

- redesigning notifications center
- redesigning chat workspace
- reworking organization or user menu behavior
- rebuilding smart navigation runtime logic
- rewriting dashboard services or widget registration
- adding mobile navbar parity
- deep visual polish

Those belong to later phases and will cause rework if pulled forward too early.

## Best First Coding Slice

If you want the smallest useful first PR or work chunk, do only this:

### Create

- `react-console/src/modules/home/shell/useHomeShellMode.ts`
- `react-console/src/modules/home/alerts/HomeTwoFaAlert.tsx`
- `react-console/src/modules/home/portal/HomePortalTargets.tsx`

### Edit

- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/RightPanel.tsx`
- `react-console/src/pages/HomePage.tsx`
- `react-console/src/components/portal/Portal.tsx`
- `react-console/src/store/uiStore.ts`
- `react-console/src/index.css`

That slice is enough to unlock a real homepage shell foundation without dragging in later-phase homepage feature work.
