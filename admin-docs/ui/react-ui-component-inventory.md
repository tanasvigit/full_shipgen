# React UI Component Inventory

This document inventories the reusable UI building blocks currently present in the React console.

It focuses on:

- shared React components
- shared CSS class families
- reusable layout helpers
- where the design system is componentized vs only class-convention-based

## 1. Shared React UI Primitives

The shared export surface currently comes from:

- `src/components/ui/index.ts`

Exported primitives:

- `EmptyState`
- `LoadingState`
- `NotificationBadge`
- `CommandPalette`
- `ContextMenu`
- `HeaderTray`
- `SearchableGridMenu`
- `Tooltip`
- `Drawer`
- `Dropdown`
- `Modal`
- `Popover`

## 2. Feedback Primitives

From `src/components/ui/Feedback.tsx`.

## 2.1 `LoadingState`

Purpose:

- generic loading placeholder

Behavior:

- spinner icon
- text label
- `role="status"`
- `aria-live="polite"`

Where it fits:

- page loading
- drawer loading
- async list fetches
- overlay loading

## 2.2 `EmptyState`

Purpose:

- generic no-data or failure-adjacent empty-state surface

Structure:

- icon
- title
- optional description

Where it fits:

- notifications
- extensions
- chat
- search/grid menus

## 2.3 `NotificationBadge`

Purpose:

- unread count display

Behavior:

- hidden when count is `0`
- displays `99+` above threshold

Where used:

- header notifications
- header chat

## 3. Menu and Utility Primitives

From `src/components/ui/Menus.tsx`.

## 3.1 `Tooltip`

Purpose:

- small hover/focus descriptor

Implementation notes:

- CSS-based
- shown on hover
- also shown on `focus-within`

## 3.2 `HeaderTray`

Purpose:

- structural wrapper for grouped top-header actions

## 3.3 `ContextMenu`

Purpose:

- simple action list menu

Current characteristics:

- low-complexity button list
- icon + label layout

## 3.4 `SearchableGridMenu`

Purpose:

- launcher-style searchable action browser

Key features:

- inline search
- filtered results
- card-grid layout
- optional pin action
- empty-state fallback

This is one of the most scalable reusable components in the current UI.

## 3.5 `CommandPalette`

Purpose:

- wrapper around `SearchableGridMenu`

Current maturity:

- present but still light in behavior
- more of a launcher surface than a full keyboard-first command palette

## 4. Overlay Primitives

From `src/components/ui/Overlays.tsx`.

## 4.1 `Dropdown`

Purpose:

- anchored floating panel

Features:

- start/end alignment
- outside click close
- Escape close
- optional mobile full-width behavior
- animation via `framer-motion`

## 4.2 `Popover`

Purpose:

- alias wrapper around `Dropdown`

## 4.3 `Drawer`

Purpose:

- right-side slide-in panel

Features:

- backdrop
- Escape close
- dialog semantics
- close button

Current use cases:

- chat
- mobile admin navigation

## 4.4 `Modal`

Purpose:

- centered overlay dialog

Features:

- backdrop
- Escape close
- scale/fade animation
- dialog semantics

Current use cases:

- dashboard management
- widget picker
- extension details
- purchase flow
- customization

## 5. Layout Components

## 5.1 `AppShell`

Purpose:

- core application frame

Provides:

- header
- sidebar
- main outlet
- optional right panel
- overlay layer mount

## 5.2 `TopHeader`

Purpose:

- top-level navigation and tray surface

Provides:

- branding
- smart navigation
- language/notification/chat/org/profile actions

## 5.3 `SidebarHost`

Purpose:

- route-aware sidebar host

Provides:

- admin sidebar
- account/settings/customization contextual sidebars
- mobile admin drawer behavior

## 5.4 `RightPanel`

Purpose:

- future context panel host

Current maturity:

- structural placeholder only

## 6. Admin Layout Components

## 6.1 `AdminPageFrame`

Purpose:

- standard page framing for admin routes

Provides:

- page wrapper
- header integration
- content area

## 6.2 `AdminStatusMessage`

Purpose:

- semantic inline admin feedback banner

Supported tones:

- `info`
- `error`
- `success`
- `warning`

## 6.3 Other admin class-level patterns

Even when not always wrapped by exported components, admin has a strong reusable class system:

- `fb-admin-section`
- `fb-admin-section-header`
- `fb-admin-section-body`
- `fb-admin-form-grid`
- `fb-admin-form-stack`
- `fb-admin-field`
- `fb-admin-empty-state`
- `fb-admin-detail-overlay`

### Important note

A large part of the React design system currently lives in CSS class conventions rather than in reusable React components.

## 7. Shared CSS-Driven Building Blocks

## 7.1 Generic shared surface classes

Examples:

- `card`
- `stat-grid`
- `stat-card`
- `table`
- `row-actions`
- `json-preview`
- `json-editor`

These are useful, but they are older and less structured than the newer `fb-*` families.

## 7.2 Console shell classes

Examples:

- `fb-app-shell`
- `fb-top-header`
- `fb-console-main`
- `fb-sidebar-host`
- `fb-main-content`
- `fb-right-panel`

## 7.3 Destination page classes

Examples:

- `fb-destination-page`
- `fb-destination-header`
- `fb-destination-toolbar`
- `fb-destination-card`
- `fb-destination-actions`
- `fb-page-pagination`

## 7.4 Dashboard classes

Examples:

- `fb-dashboard-grid`
- `fb-dashboard-widget-shell`
- `fb-dashboard-edit-bar`
- `fb-dashboard-option`
- `fb-widget-picker-card`

## 7.5 Navigation classes

Examples:

- `fb-smart-nav`
- `fb-module-nav`
- `fb-module-link`
- `fb-command-card`
- `fb-customize-item`

## 7.6 FleetOps classes

Examples:

- `fo-layout`
- `fo-sidebar`
- `fo-panel`
- `fo-modal`
- `fo-table`
- `fo-btn-primary`
- `fo-btn-secondary`

## 8. Componentization Audit

## 8.1 What is properly componentized already

- overlays
- feedback primitives
- smart navigation entry surfaces
- admin page framing
- some shell elements

## 8.2 What still relies mostly on CSS conventions

- buttons
- form fields
- cards
- stat blocks
- tables
- page headers
- pills and badges

## 8.3 Why this matters

The current system is strong enough to ship, but it is harder to polish globally because many visual behaviors are encoded as:

- CSS class agreements
- repeated JSX patterns
- module-specific variants

rather than as a shared component API.

## 9. Inventory Summary

### Current state

The React app already has a real primitive layer, especially for:

- overlays
- menus
- loading/empty states
- shell composition

### Missing maturity

The app still needs stronger shared component APIs for:

- buttons
- fields
- cards
- table/list presentation
- pills/status chips

### Bottom line

The UI system is partially componentized and partially convention-based. That is enough to document and improve, but the next polish phase should move more of the visual system into shared, explicit primitives.
