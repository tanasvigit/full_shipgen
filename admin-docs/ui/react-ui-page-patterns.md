# React UI Page Patterns, Components, and UX Surfaces

This document maps the main page-level and component-level UX patterns used in the React console.

It covers:

- auth pages
- dashboard/home
- destination pages
- notifications
- extensions
- chat
- admin pages and forms
- FleetOps pages
- cards, tables, lists, stats, empty states, and loading states

## 1. Overall Pattern Language

The React app already uses several recurring page archetypes.

The most important ones are:

1. `auth-card` pages
2. home/dashboard workspace pages
3. destination pages
4. admin pages
5. FleetOps workspace pages
6. modal/drawer-driven workflows

This matters because future UI polish should standardize **within** these archetypes before trying to polish every screen individually.

## 2. Auth Pages

Representative file:

- `src/pages/LoginPage.tsx`

## 2.1 Visual structure

The auth experience is currently simple:

- centered card
- large title
- stacked fields
- primary button
- inline recovery link
- plain error text

### Current styling

- card width: `460px`
- translucent dark background
- blurred surface
- rounded corners
- strong shadow

## 2.2 UX character

The auth experience is functional and readable, but not yet premium.

It currently lacks:

- richer field states
- stronger onboarding/brand storytelling
- supporting microcopy hierarchy
- more refined spacing rhythm

## 3. Home Page and Dashboard Workspace

Representative files:

- `src/pages/HomePage.tsx`
- `src/modules/dashboard/HomeDashboard.tsx`
- `src/modules/dashboard/dashboard.css`

## 3.1 Home page composition

The home page currently stacks:

1. a two-factor alert
2. the dashboard workspace
3. a spacer
4. portal targets for injected home content

### UX meaning

The home page is meant to be a personalized operating surface rather than a static landing page.

## 3.2 Dashboard workspace behavior

The dashboard supports:

- dashboard switching
- recent dashboards
- rename
- duplicate
- reset layout
- set default
- export placeholder
- widget management
- edit mode
- widget add/remove/reorder/resize
- widget collapse/expand

### UX maturity

This is one of the richest interactive areas in the current React app.

## 3.3 Dashboard visual patterns

Recurring patterns:

- compact toolbar controls
- structured widget shells
- status dots and status pills
- drag handles
- skeleton loading placeholders
- grouped actions in compact edit bars

### Visual character

The dashboard feels like:

- operational
- configurable
- modular
- productivity-first

## 3.4 Dashboard UX strengths

- clear editing mode distinction
- local action menus
- strong card containment
- reasonable empty/loading states
- meaningful progress and widget metadata

## 3.5 Dashboard UX gaps

- button variants are still mostly class-based
- fullscreen/detail treatment is present but not yet part of a broader system story
- some widget density and spacing choices vary by widget type

## 4. Destination Page Pattern

Representative files:

- `src/modules/notifications/NotificationsCenter.tsx`
- `src/modules/extensions/ExtensionsDirectory.tsx`

This is the most reusable non-admin page pattern in the app.

## 4.1 Typical structure

1. title + description
2. top-right actions
3. stat summary cards
4. main work card or split workspace
5. filters/search controls
6. content list/table/card grid
7. pagination footer

### Shared classes involved

- `fb-destination-page`
- `fb-destination-header`
- `fb-destination-actions`
- `fb-destination-toolbar`
- `fb-destination-toolbar-actions`
- `fb-destination-card`
- `fb-destination-stat`

## 4.2 UX quality

This pattern is strong because it gives the app a recognizable content-page grammar.

It works well for:

- medium-complexity data views
- list/detail catalog surfaces
- searchable and paginated screens

## 5. Notifications Center

Representative file:

- `src/modules/notifications/NotificationsCenter.tsx`

## 5.1 Interaction model

The notifications center supports:

- grouped notifications
- search
- date filtering
- page size selection
- row selection
- bulk mark-read
- bulk delete
- mark-all-read
- row navigation
- pagination

## 5.2 UI patterns used

- stat cards for totals
- inline search input
- inline select filters
- grouped list sections
- row cards with checkbox + icon + content + action button
- status pills for read/unread state

## 5.3 UX strengths

- strong task-oriented workflow
- good use of grouping and bulk actions
- readable metadata
- sensible list density

## 5.4 UX caveats

- row action affordances are somewhat repetitive
- card rows are visually rich but may become dense on very large datasets

## 6. Extensions Directory

Representative file:

- `src/modules/extensions/ExtensionsDirectory.tsx`

## 6.1 Surface model

The extensions area is a hybrid of:

- catalog
- library manager
- registry operations console
- purchase flow

## 6.2 Major UI pieces

- sidebar for library/explore categories
- stats cards
- search and page-size filter
- installed list view
- explore/purchased card grid
- details modal
- install/uninstall progress modal
- Stripe checkout modal

## 6.3 UX quality

This is another relatively mature surface.

It already supports:

- browse
- inspect
- install
- uninstall
- purchase
- operation feedback

### Strong points

- good split between browse and manage
- action-driven detail modal
- progress visualization for long-running operations

### Weak points

- extension cards are informative but still visually basic
- several states rely on text/status pills instead of stronger visual hierarchy

## 7. Chat UX

Representative files:

- `src/modules/header/chat/ChatDrawer.tsx`
- `src/modules/chat/ChatWorkspace.tsx`

## 7.1 Chat surface

The chat preview currently lives in a drawer.

Inside it:

- top toolbar
- conversation/channel list
- message thread
- typing/presence display
- read-only composer placeholder

## 7.2 UI patterns

- split view layout
- active row highlighting
- unread count bubble
- presence indicators
- message bubble differentiation for self vs others

## 7.3 UX strengths

- solid structural pattern
- appropriate use of a drawer for lightweight access
- responsive collapse on smaller screens

## 7.4 UX limitations

- composer is placeholder-only
- message formatting and richness are still minimal
- the visual language is serviceable but not yet polished

## 8. Menu, Tray, and Utility Surfaces

Representative files:

- `src/components/ui/Menus.tsx`
- header menu/tray modules

## 8.1 Reusable patterns

- `Tooltip`
- `HeaderTray`
- `ContextMenu`
- `SearchableGridMenu`
- `CommandPalette`

## 8.2 Searchable grid menu pattern

Used for launcher-style surfaces:

- search field at top
- two-column grid on desktop
- card-like action items
- optional pin action
- empty-state fallback

### UX quality

This is a good pattern for a growing modular product because it scales better than a flat dropdown.

## 9. Loading, Empty, and Feedback States

Representative file:

- `src/components/ui/Feedback.tsx`

## 9.1 Shared feedback primitives

- `LoadingState`
- `EmptyState`
- `NotificationBadge`

### LoadingState

- spinner icon
- polite live region
- centered stack

### EmptyState

- icon
- title
- optional description
- centered treatment

### NotificationBadge

- hidden at zero
- hard cap at `99+`

## 9.2 Feedback assessment

The shared feedback primitives are simple but effective.

The main limitation is that more advanced empty-state variants are still implemented ad hoc at page level rather than through a richer feedback system.

## 10. Cards, Lists, and Stats

## 10.1 Generic cards

The codebase still uses older generic classes like:

- `card`
- `stat-grid`
- `stat-card`
- `table`

These are especially common in older foundation pages and generic settings pages.

## 10.2 Newer card language

Newer product surfaces tend to use more specific, task-scoped components/classes such as:

- `fb-destination-card`
- `fb-extension-catalog-card`
- `fb-dashboard-widget-shell`
- `fb-admin-section`

### UX implication

The app is in a transition from generic shared cards to surface-specific card patterns.

## 10.3 Stat patterns

Stats appear in multiple visual languages:

- older generic stat cards
- admin stat cards
- dashboard metrics
- FleetOps stat cards

They share the idea of:

- muted label
- large numeric value
- dark card surface

but do not yet share one unified implementation.

## 11. Tables and Data Lists

The app uses several data presentation strategies.

## 11.1 Generic tables

Defined with `.table` in `src/index.css`:

- compact headers
- subdued uppercase labels
- horizontal row separators

## 11.2 Admin tables

Admin tables live inside section wrappers with:

- `fb-admin-table-shell`
- `fb-admin-table-wrap`

They feel more structured and more integrated into the admin system.

## 11.3 List-card patterns

Many newer pages prefer list cards rather than strict tables:

- notifications
- extensions installed list
- profile organizations
- customization rows
- dashboard lists

### UX benefit

List cards adapt better to responsive layouts and allow richer content blocks.

## 11.4 Current table/list state

The product currently uses both:

- table-oriented CRUD thinking
- card/list-oriented workspace thinking

This duality is useful, but it should be standardized more deliberately during polish work.

## 12. Forms and Field Patterns

## 12.1 Generic forms

Older/general pages often use:

- native inputs directly
- generic `.card`
- simple button rows

Examples:

- `LoginPage`
- `SettingsProfilePage`
- `VirtualPage`

## 12.2 Admin forms

Admin form pattern is much stronger and more reusable.

Common structures:

- `fb-admin-form-stack`
- `fb-admin-form-grid`
- `fb-admin-field`
- `fb-admin-field-label`
- `fb-admin-field-note`
- `fb-admin-form-actions`

### Admin form UX strengths

- clear grouping
- good note/microcopy treatment
- better hierarchy than the older generic settings pages
- more consistent action placement

## 12.3 FleetOps forms

FleetOps has its own form ecosystem:

- dense form grids
- operational controls
- searchable select patterns
- modal-driven create/edit flows
- map-linked workflows

### UX implication

FleetOps forms feel much more like internal operations software than like shared app settings forms.

## 13. Admin Page UX

Representative files:

- `src/modules/admin/admin.css`
- `src/modules/admin/layout/AdminPageFrame.tsx`
- admin page modules

## 13.1 Admin visual grammar

Admin pages use:

- page eyebrow
- title and description
- sectioned bordered surfaces
- form stacks and grids
- status messages
- empty-state blocks
- quick-action pills
- right-side detail overlays

## 13.2 Strong admin patterns already present

- reusable page frame
- reusable status messaging
- multi-column forms that collapse responsively
- section wrappers with clear hierarchy
- runtime admin sidebar grouping
- detail overlay structure

## 13.3 Admin current maturity

The admin area is one of the most systematized visual parts of the React app.

It is noticeably more cohesive than:

- generic profile/settings pages
- some legacy foundation pages

## 14. FleetOps UI Pattern

Representative file:

- `src/modules/fleetops/fleetops.css`

## 14.1 FleetOps visual identity

FleetOps uses:

- its own `fo-*` class namespace
- a distinct navy/blue operations palette
- compact, data-heavy layouts
- map tools
- kanban boards
- scheduler/calendar views
- command-style toolbars

## 14.2 Major FleetOps patterns

- analytics dashboards
- drag/drop orchestrator surfaces
- scheduler sidebars and calendars
- map overlays and tool palettes
- CRUD tables and detail panels
- modal-heavy workflows

## 14.3 UX strengths

- purpose-built for operations work
- rich task density
- many concrete workflows already represented

## 14.4 UX risk

FleetOps feels visually and behaviorally separate from the main console shell.

That may be acceptable strategically, but it should be a conscious product decision.

## 15. Virtual and Placeholder Surfaces

Representative file:

- `src/pages/VirtualPage.tsx`

Some surfaces still expose implementation-state UX:

- slug/scope text
- extension host debug-like behavior
- generic fallback messaging

### UX meaning

The app has route completeness, but some pages still reveal migration scaffolding rather than polished user-facing product design.

## 16. Page Pattern Summary

### Most mature UI surfaces

- dashboard workspace
- admin page system
- notifications center
- extensions directory

### Mid-maturity surfaces

- chat drawer
- contextual settings/account pages
- generic destination pages

### Least polished surfaces

- auth flow presentation
- generic old-style settings pages
- virtual/placeholder pages
- right panel placeholder

### Bottom line

The React app already contains enough repeated page patterns to support a real UI/UX polish phase. The best next step is not to redesign everything at once, but to standardize these existing archetypes so they feel like one product family.
