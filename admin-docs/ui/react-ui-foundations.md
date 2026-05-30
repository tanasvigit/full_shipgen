# React UI Foundations

This document describes the visual foundations of the React console in `react-console`.

It covers:

- rendering stack
- styling architecture
- theme model
- colors
- typography
- spacing and sizing
- radius, borders, and shadows
- motion defaults
- form controls
- base interaction states

## 1. Styling Stack

The React console uses a hybrid front-end styling approach.

### Core technologies

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS v4` through `@tailwindcss/vite`
- plain CSS modules/files imported at feature level
- `clsx` + `tailwind-merge` through `cn()` for conditional class composition
- `framer-motion` for overlays and animated UI state transitions

### Practical styling model in the codebase

The UI is **CSS-first**, not utility-first.

Tailwind is present, but most layout, color, spacing, and surface styling comes from authored CSS files:

- `src/index.css`
- `src/modules/admin/admin.css`
- `src/modules/navigation/navigation.css`
- `src/modules/dashboard/dashboard.css`
- `src/modules/fleetops/fleetops.css`

Tailwind utilities are used mostly for small inline concerns like:

- icon sizing (`h-4`, `w-4`, `h-5`, `w-5`)
- simple animation (`animate-spin`)

### Architecture takeaway

The project behaves more like a hand-authored CSS system with Tailwind available as a helper, not like a canonical Tailwind design system.

## 2. Theme Model

Theme state exists in `src/store/themeStore.ts`.

### Supported theme modes

- `dark`
- `light`
- `system`

### What the store actually does

The store:

- persists theme preference in local storage under `fleetbase.theme`
- resolves `system` against `prefers-color-scheme`
- writes:
  - `document.documentElement.classList.toggle('dark', ...)`
  - `document.documentElement.dataset.theme = mode`

### Important current limitation

Although the theme store supports light/dark/system selection, the current CSS implementation is effectively **dark-only**.

Reasons:

- the global token definitions in `src/index.css` are dark-themed
- no alternate token block exists for `[data-theme="light"]`
- no meaningful light-mode override layer exists in the reviewed CSS

### Practical conclusion

The app has a theme state mechanism, but not yet a fully implemented multi-theme visual system.

## 3. Color System

The root token layer lives in `src/index.css`.

## 3.1 Core global tokens

### Backgrounds and surfaces

- `--bg: #0b1531`
- `--bg-2: #0f1c3d`
- `--surface: rgba(24, 37, 69, 0.84)`
- `--surface-2: rgba(20, 31, 58, 0.92)`
- `--surface-soft: rgba(29, 44, 79, 0.85)`

### Borders

- `--border: rgba(102, 126, 173, 0.34)`
- `--fb-border-soft: rgba(91, 103, 128, 0.32)`
- `--fb-border-strong: rgba(91, 103, 128, 0.56)`

### Text

- `--text: #e8edf8`
- `--text-muted: #a9b8d6`

### Accent and semantic

- `--accent: #6f86ff`
- `--accent-2: #22c55e`
- `--danger: #fb7185`

### Shell-specific surfaces

- `--fb-surface: #111827`
- `--fb-surface-elevated: #151f32`
- `--fb-surface-muted: rgba(15, 23, 42, 0.52)`

### Focus

- `--fb-focus-ring: 0 0 0 3px rgba(96, 165, 250, 0.22)`

## 3.2 Global page background

The document body uses a dark gradient:

- `linear-gradient(180deg, var(--bg) 0%, #09122a 100%)`

However, many core application shells override the visual impression with solid dark surfaces such as:

- `#111827` for the primary shell
- `#06142c`, `#08152e`, `#0b1a38` inside FleetOps

### Practical result

The product is visually dark, cool-toned, and slate/navy dominant.

## 3.3 Accent color usage

The application does not rely on one single accent only. It uses a small family of recurring highlight colors:

### Blue / indigo

Used for:

- active nav states
- brand identity
- progress bars
- focused surfaces
- selected cards
- some pills

Representative values:

- `#4da3ff`
- `#6f86ff`
- `#2563eb`
- `#3b82f6`
- `rgba(59, 130, 246, 0.14)`
- `rgba(79, 70, 229, 0.18)`

### Yellow / amber

Used for:

- notification badges
- warnings
- highlight alerts
- organization initials badge

Representative values:

- `#f2c94c`
- `#fde68a`
- `#fcd34d`

### Green

Used for:

- success
- online/presence states
- healthy dashboard statuses
- progress completion accents

Representative values:

- `#22c55e`
- `#34d399`
- `#86efac`

### Red / pink

Used for:

- error text
- destructive states
- uninstall/failure messaging

Representative values:

- `#fb7185`
- `#f87171`
- `#fca5a5`

## 3.4 Color system assessment

Strengths:

- consistent dark-first palette
- good use of subdued text and brighter foreground hierarchy
- accent colors have semantic intent

Current issues:

- many colors are hardcoded directly in component CSS instead of tokenized
- some modules use different blue families and saturation levels
- FleetOps has its own separate palette instead of a shared token layer
- toast styling in `src/main.tsx` is hardcoded and bypasses theme tokens

## 4. Typography

## 4.1 Primary font

The app imports `Inter` from Google Fonts:

- weights: `400`, `500`, `600`, `700`, `800`

The body stack is:

- `'Inter', system-ui, -apple-system, Segoe UI, sans-serif`

## 4.2 Typographic character

The UI typography is:

- dense
- modern SaaS-style
- compact in navigation and admin areas
- slightly more spacious in content pages

## 4.3 Common text sizes seen in code

### Large headers

- `h2` global default: `1.75rem`
- admin page title: `1.18rem`
- dashboard/home titles: `1rem` to `1.875rem`

### Section and card headings

- `0.92rem`
- `0.88rem`
- `0.85rem`
- `0.82rem`

### UI labels and metadata

- `0.62rem` to `0.76rem` for:
  - eyebrow text
  - uppercase labels
  - table headers
  - badges
  - sidebar headings

### Body/supporting copy

- `0.74rem` to `0.86rem`

## 4.4 Typographic hierarchy patterns

Recurring hierarchy pattern across the app:

1. primary title in bright near-white
2. muted description beneath
3. uppercase micro-labels for grouping
4. subtle metadata and timestamps in slate blue-gray

### Practical assessment

The hierarchy is readable and consistent in spirit, but not yet fully standardized in tokens or shared typography utilities.

## 5. Spacing and Sizing

There is **no formal spacing token scale** exported as variables.

Spacing is mostly hardcoded in CSS using recurring values.

## 5.1 Common spacing values

Very common values across the app:

- `0.15rem`
- `0.2rem`
- `0.25rem`
- `0.35rem`
- `0.45rem`
- `0.55rem`
- `0.65rem`
- `0.75rem`
- `0.85rem`
- `0.9rem`
- `1rem`

Larger page/frame spacing:

- `1.05rem`
- `1.25rem`
- `1.45rem`
- `2rem`
- `2.6rem`

## 5.2 Major shell dimensions

- header height: `--fb-header-height: 40px`
- standard sidebar width: `--fb-sidebar-width: 160px`
- admin sidebar width: `--fb-admin-sidebar-width: 228px`
- right panel width: `304px`
- chat drawer width: `min(410px, 100vw)`
- floating panel widths commonly between `248px` and `720px`

## 5.3 Layout density

Different surfaces use different density levels:

- header and nav: very compact
- admin pages: compact but structured
- destination pages: medium spacing
- dashboard widgets: medium spacing with tighter controls
- FleetOps: dense workspace/productivity UI

### Practical assessment

The spacing language is internally recognizable, but it is not token-driven enough yet. Many page families use slightly different values for similar problems.

## 6. Radius, Borders, and Shadows

## 6.1 Radius tokens

- `--fb-radius-xs: 0.35rem`
- `--fb-radius-sm: 0.45rem`
- `--fb-radius-md: 0.55rem`
- `--fb-radius-lg: 0.65rem`

Additional direct usage outside tokens:

- `0.75rem`
- `0.8rem`
- `0.85rem`

## 6.2 Borders

The app relies heavily on soft borders to define hierarchy.

Common border characteristics:

- low-opacity blue-gray strokes
- transparent borders that become visible on hover/active
- dashed borders for edit states or placeholders

The UI uses borders more often than large shadows to define separation.

## 6.3 Shadows

Global shadow tokens:

- `--shadow: 0 12px 28px rgba(5, 10, 26, 0.35)`
- `--fb-shadow-soft: 0 8px 20px rgba(2, 6, 23, 0.18)`
- `--fb-shadow-panel: 0 18px 36px rgba(2, 6, 23, 0.28)`

Usage patterns:

- cards and auth surfaces use `--shadow`
- small elevated cards use `--fb-shadow-soft`
- overlays/drawers/modals use `--fb-shadow-panel`

### Practical assessment

The app prefers subtle dark elevation rather than dramatic depth.

## 7. Motion and Transition Language

## 7.1 Shared timing tokens

- `--fb-duration-fast: 140ms`
- `--fb-duration-normal: 180ms`
- `--fb-ease: cubic-bezier(0.16, 1, 0.3, 1)`

## 7.2 Overlay animation timing

In `src/components/ui/Overlays.tsx`:

- floating panel transition: `0.14s`
- modal/drawer transition: `0.18s`

### Motion styles used

- fade + slight translate for dropdowns/popovers
- slide-in from right for drawers
- fade + scale for modals
- spinner rotation for loading
- shimmer skeletons in dashboard widgets
- small hover lift on older cards and buttons

## 7.3 Motion philosophy

The current UI uses motion as polish, not spectacle.

It is mostly:

- quick
- subtle
- functional

## 7.4 Motion consistency issues

- some components use tokenized durations
- others use direct `160ms`, `0.2s`, `0.22s`, `0.25s`
- hover movement appears in some older surfaces but not newer shell components

## 8. Base Form Styling

Global form element styling comes from `src/index.css`.

### Shared input behavior

- full width by default
- dark translucent backgrounds
- soft border
- large rounded corners
- blur backdrop on some surfaces
- blue/purple focus ring

### Common input values

- padding around `0.7rem 0.8rem`
- border radius `0.8rem`
- background `rgba(15, 23, 42, 0.5)`

### Placeholder styling

- muted slate placeholder text

### Selects and textareas

They follow the same basic system as text inputs.

### Checkbox handling

Checkboxes are treated as a special case with auto width instead of full width.

## 8.1 Form system assessment

Strengths:

- consistent base fields
- dark-theme fit
- visible focus state

Current issues:

- there is no shared React field component layer
- labels, notes, validation, and grouping are mostly class-convention-based
- older pages and newer admin pages style forms differently

## 9. Button Styling

## 9.1 Global default button

The global button style is strong and visually opinionated:

- indigo gradient background
- rounded `0.8rem`
- medium-heavy weight text
- hover lift
- glow-like shadow on hover

## 9.2 Specialized button families

The app then overrides this default in many places:

- `fb-icon-btn`
- `fb-menu-item`
- `fb-org-trigger`
- `fb-user-trigger`
- `fb-pin-btn`
- dashboard pickers
- FleetOps action buttons
- admin link-like destructive buttons

### Practical consequence

There is no single shared button component API yet. The codebase depends on CSS class families and contextual button overrides.

## 10. Focus, Hover, and State Styling

## 10.1 Focus

Global focus-visible handling exists:

- `:where(button, a, input, select, textarea, [role='button']):focus-visible`
- uses `--fb-focus-ring`

This is a strong baseline.

## 10.2 Hover

Hover behavior varies by component family:

- global buttons lift slightly
- shell/menu buttons usually do not lift, they tint background instead
- cards often change border and background
- dashboard and FleetOps use hover to signal interactivity

## 10.3 Disabled

Disabled behavior is mostly:

- lower opacity
- cursor changes to `not-allowed`

## 11. Toast Styling

The global toaster is configured in `src/main.tsx`.

Current style:

- background: `#0f1f40`
- text: `#dbeafe`
- border: `1px solid #2a3e6a`

### Important note

This styling is hardcoded and currently not connected to the CSS variable theme system.

## 12. Foundations Summary

### What is already strong

- dark visual identity
- coherent shell palette
- Inter-based typography
- reusable radius/shadow language
- real motion primitives
- global focus treatment
- consistent dark input styling

### What is not yet mature

- light theme is not actually implemented visually
- spacing is repeated manually rather than tokenized
- color usage is only partially tokenized
- button and field systems are class-based, not component-based
- FleetOps still behaves like its own visual subsystem

### Bottom line

The React app already has a legitimate UI foundation, but it is a **working foundation**, not yet a fully normalized design system. The next polish phase should standardize tokens, eliminate hardcoded drift, and connect the theme model to real visual variants.
