# React UI Shells, Navigation, and Behavioral Structure

This document explains how the React console is structurally composed from a UI/UX point of view.

It covers:

- application shells
- route-aware layout behavior
- header composition
- sidebars
- right-side panels
- navigation systems
- overlays, menus, modals, and drawers
- responsive behavior
- localization and accessibility cues

## 1. Shell Architecture

The app does not use one single shell everywhere.

It currently has multiple UI shells:

1. the general React console shell
2. the admin shell layered inside that console shell
3. the home/dashboard workspace shell
4. the destination-page shell used by notifications, extensions, profile-like pages
5. the separate FleetOps shell

This is important because polish work must decide whether these should stay distinct or converge into a more unified system.

## 2. Main Console Shell

The main shell is implemented through:

- `src/layouts/AppShell.tsx`
- `src/layouts/TopHeader.tsx`
- `src/layouts/SidebarHost.tsx`
- `src/layouts/RightPanel.tsx`

## 2.1 Shell behavior

`AppShell`:

- renders the top header
- renders route-aware sidebar and right panel
- renders the current routed page through `<Outlet />`
- mounts global overlay layers
- dispatches route change events:
  - `fleetbase:route-will-change`
  - `fleetbase:route-did-change`

### UX meaning

This shell is designed to behave like an application workspace, not just a page wrapper.

## 2.2 Shell layout grid

The default main area uses a grid:

- sidebar
- main content
- optional right panel

Key behaviors:

- sidebar can be hidden
- right panel can be hidden
- home shell routes can collapse to single-column
- admin route uses its own sidebar width rules

## 3. Route-Aware Layout Logic

Route-specific shell decisions are centralized in:

- `src/modules/home/shell/useHomeShellMode.ts`

### Home shell routes

Currently treated specially:

- `/`
- `/dashboard`

Behavior:

- sidebar hidden
- right panel hidden
- single-column main layout

### Context-sidebar routes

These routes can show a contextual sidebar:

- `/account`
- `/profile`
- `/settings`
- `/customization`

### Admin routes

Admin routes use the admin sidebar model instead of the standard contextual sidebar.

### UX meaning

The product already distinguishes between:

- workspace/dashboard mode
- contextual settings mode
- admin mode

This is good architecture for future polish because each surface has a clear behavioral identity.

## 4. Top Header

The top header is implemented in `src/layouts/TopHeader.tsx`.

## 4.1 Header contents

Left side:

- Fleetbase brand link
- smart navigation bar
- portal targets for route-specific injected content

Right side:

- language tray trigger
- notifications trigger
- chat trigger
- organization trigger
- profile trigger
- portal target for header actions

## 4.2 Header UI style

The header is:

- short and dense
- dark and utility-driven
- aligned to product-workspace behavior
- more like an app frame than a marketing/product header

### Dimensions and styling

- height: `40px`
- background: `var(--fb-surface)`
- bottom border: `var(--fb-border-strong)`

### UX character

It feels closer to:

- admin software
- operations tooling
- internal SaaS

than a consumer product.

## 4.3 Header interaction model

Header buttons use lightweight tray patterns rather than full navigation changes.

This means key secondary tasks happen in place:

- language switching
- notifications review
- chat preview
- organization switching/context
- profile/account actions

That is a strong UX decision because it keeps the user inside the current workspace.

## 5. Navigation Systems

The app currently has more than one navigation system.

## 5.1 Smart navigation

The smart nav bar is built in:

- `src/modules/navigation/smart-nav/SmartNavigationBar.tsx`
- `src/modules/navigation/navigation.css`

It provides:

- pinned module navigation
- overflow launcher
- navigation customization modal
- pin/unpin behavior

### UX pattern

This is a compact, productivity-oriented nav model:

- frequently used items remain visible
- overflow items move to a launcher
- users can customize pinned navigation

### Strength

This is one of the more product-mature UX patterns in the React app.

## 5.2 Context sidebars

For non-admin contextual routes, `SidebarHost.tsx` builds small local navigation groups for:

- account
- settings
- customization

These sidebars are straightforward and route-driven.

## 5.3 Admin sidebar

Admin routes use `AdminSidebar` inside `SidebarHost`.

Admin visual language includes:

- wider sidebar
- grouped sections
- uppercase section headings
- runtime extension panels
- active-state highlighting

### UX quality

The admin sidebar is much more structured than the generic contextual sidebar and already reads like a dedicated product surface.

## 5.4 FleetOps sidebar

FleetOps uses a separate shell and a separate sidebar system entirely.

This gives FleetOps:

- different spacing
- different palette
- different control density
- a stronger workstation feel

### UX tradeoff

This helps FleetOps feel purpose-built, but it also increases overall design-system fragmentation.

## 6. Right Panel

The right panel exists in `src/layouts/RightPanel.tsx`.

Current behavior:

- route-aware
- hidden on home and admin routes
- toggleable through UI state
- currently placeholder content

### UX meaning

The application has architecture for contextual side detail panels, but this capability is not yet materially realized.

This is a future polish opportunity:

- contextual inspectors
- record details
- quick actions
- related activity

## 7. Overlay System

The shared overlay primitives live in `src/components/ui/Overlays.tsx`.

They provide:

- `Dropdown`
- `Popover`
- `Drawer`
- `Modal`

## 7.1 Overlay rendering model

Overlays render through portal/wormhole layers, not inline in the normal DOM flow.

This is a good structural decision because it prevents z-index chaos and keeps overlay behavior centralized.

## 7.2 Dropdown and popover behavior

Dropdowns:

- position relative to trigger anchor
- align start or end
- close on outside click
- close on Escape
- become full-width mobile panels when needed

Animation:

- fade + slight translate

### UX assessment

These are practical, compact, and appropriate for header trays and launcher surfaces.

## 7.3 Drawer behavior

Drawers:

- slide from the right
- include backdrop
- close on backdrop click
- close on Escape
- use `role="dialog"` and `aria-modal="true"`

Used for:

- chat
- mobile admin navigation

## 7.4 Modal behavior

Modals:

- fade/scale in
- include backdrop
- close on backdrop click
- close on Escape
- use dialog semantics

Used for:

- dashboard dialogs
- extension details
- extension checkout
- widget picker
- navigation customization

## 7.5 Overlay UX strengths

- consistent motion style
- good visual elevation
- centralized behavior
- mobile-aware dropdown handling

## 7.6 Overlay UX gaps

Notable limitations in current code:

- no obvious focus trap implementation
- no visible scroll locking logic in the shared primitives
- keyboard navigation within menus is basic rather than advanced

## 8. Header Trays and Lightweight Workflows

The header uses lightweight tray-style interactions for:

- languages
- notifications
- organization menu
- profile menu
- chat

This keeps the main shell fast and non-disruptive.

### UX takeaway

The React app is already moving toward a desktop-app-like workflow model rather than a page-to-page-only model.

## 9. Destination Page Pattern

Many non-home, non-admin pages use a shared content pattern visible in pages like:

- notifications
- extensions
- profile/customization-type surfaces

This pattern usually includes:

1. page header
2. supporting description
3. top-level actions
4. stat cards
5. main content card or split workspace
6. filters, search, pagination, and list/table content

### UX strength

This is one of the clearest reusable page archetypes in the React app.

## 10. Admin Page Pattern

Admin pages are composed through:

- `AdminPageFrame`
- admin section components/classes
- status messages
- table wrappers
- form grids
- detail overlays

Common admin structure:

1. eyebrow
2. page title
3. page description
4. optional actions
5. one or more bordered admin sections

### UX character

Admin pages are:

- dense
- operational
- structured
- more mature than the older generic settings pages

## 11. FleetOps Shell Pattern

FleetOps is rendered through:

- `src/modules/fleetops/layout/FleetOpsLayout.tsx`
- `src/modules/fleetops/fleetops.css`

Structure:

- FleetOps header
- FleetOps sidebar
- FleetOps content workspace

### FleetOps UX characteristics

- darker and more saturated palette
- more old-school workstation density
- many embedded tools and operators
- custom overlays, tables, maps, schedulers, kanban boards, and modal surfaces

### UX implication

FleetOps is currently a distinct product-within-the-product from a visual perspective.

## 12. Responsive Behavior

Responsiveness is handled through both:

- CSS media queries
- `useMediaQuery('(max-width: 768px)')`

## 12.1 Common breakpoints found

- `1180px`
- `1024px`
- `980px`
- `900px`
- `860px`
- `768px`
- `720px`
- `700px`
- `640px`
- `560px`

## 12.2 Key responsive behaviors

### Main console

- home/destination page padding reduces on smaller screens
- chat drawer stack collapses to one column
- floating panels can become full-width mobile sheets
- sidebar behavior changes significantly for admin mobile nav

### Admin

- admin sidebar disappears at mobile widths
- admin nav becomes drawer-based
- multi-column form and stat grids collapse to one column
- overlay toolbars stack vertically

### Dashboard

- widgets collapse to full-width
- controls wrap
- widget picker grid becomes single-column

### FleetOps

- main shell collapses to single column
- stats and kanban grids reduce columns
- table/filter bars stack
- overlay/map layouts adapt for smaller widths

## 12.3 Responsive assessment

The codebase shows genuine responsive intent, especially for admin and dashboard workflows.

However, mobile behavior is still secondary to desktop productivity in the current design.

## 13. Localization and International UX

Localization is initialized in:

- `src/i18n.ts`
- `src/i18n/resources.ts`

### Current behavior

- translations are loaded from the Ember translation YAML files
- document `lang` is set from the active locale
- document `dir` becomes `rtl` for Arabic locales

### UX significance

This is a meaningful foundation:

- internationalization is not mocked
- text direction is considered
- language switching is integrated into the shell

### Current caution

The CSS and layout system may not yet be fully audited for real RTL parity even though document direction support exists.

## 14. Accessibility Cues Present in Code

Visible accessibility-positive patterns:

- `focus-visible` styling at global level
- `aria-label` on many icon-only buttons
- `aria-haspopup` and `aria-expanded` on tray/menu triggers
- `role="dialog"` and `aria-modal="true"` for modal/drawer surfaces
- loading states use `role="status"` and `aria-live="polite"`
- some tooltip content appears on focus as well as hover
- screen-reader utility exists in FleetOps (`fo-sr-only`)

## 14.1 Accessibility gaps still likely present

Based on the reviewed code, likely improvement areas include:

- focus trapping in dialogs
- keyboard menu navigation depth
- more robust semantic tables and labels across all modules
- stronger validation/error semantics on forms
- clearer announcement patterns for async updates

## 15. Shell and Navigation Summary

### What is strong today

- route-aware shell architecture
- dense, product-like top header
- smart navigation with customization
- real overlay system
- admin shell maturity
- responsive drawer conversion for mobile admin navigation

### What still needs polish

- right panel is still placeholder
- multiple navigation languages coexist
- FleetOps remains visually separate
- contextual sidebars are much simpler than admin
- accessibility behavior is good at the baseline level, but not yet fully mature

### Bottom line

The React app already has solid shell and navigation infrastructure. The next UX phase should focus on making these surfaces feel more unified, more intentional, and more behaviorally complete, especially around contextual panels, accessibility, and cross-module consistency.
