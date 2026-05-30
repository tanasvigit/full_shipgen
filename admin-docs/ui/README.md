# React Console UI/UX Documentation

This folder documents the current UI and UX implementation of the React application in `react-console`.

It is intended to be the source-of-truth audit for:

- visual foundations
- theme and color usage
- typography
- spacing and sizing
- layout shells and navigation behavior
- forms, tables, cards, overlays, and feedback states
- motion and interaction patterns
- responsiveness
- localization and accessibility cues
- current inconsistencies and polish gaps

These documents describe the UI **as it exists in code today**, not the future target state.

## Recommended reading order

1. `react-ui-foundations.md`
2. `react-ui-shells-navigation.md`
3. `react-ui-component-inventory.md`
4. `react-ui-page-patterns.md`
5. `react-ui-polish-audit.md`

## Primary source files reviewed

- `react-console/src/index.css`
- `react-console/src/modules/admin/admin.css`
- `react-console/src/modules/navigation/navigation.css`
- `react-console/src/modules/dashboard/dashboard.css`
- `react-console/src/modules/fleetops/fleetops.css`
- `react-console/src/main.tsx`
- `react-console/src/App.tsx`
- `react-console/src/layouts/AppShell.tsx`
- `react-console/src/layouts/TopHeader.tsx`
- `react-console/src/layouts/SidebarHost.tsx`
- `react-console/src/layouts/RightPanel.tsx`
- `react-console/src/components/ui/Feedback.tsx`
- `react-console/src/components/ui/Menus.tsx`
- `react-console/src/components/ui/Overlays.tsx`
- `react-console/src/store/themeStore.ts`
- `react-console/src/hooks/useMediaQuery.ts`
- `react-console/src/modules/home/shell/useHomeShellMode.ts`
- representative pages and modules across admin, home, chat, notifications, extensions, and FleetOps

## High-level conclusion

The React console already has a real UI layer. It is not just route scaffolding anymore.

The current front-end is built around:

- a dark-first visual system
- CSS-variable-driven shell tokens
- CSS-first component styling with selective Tailwind utility usage
- lightweight motion with `framer-motion`
- several distinct UX surfaces:
  - console shell
  - admin shell
  - dashboard workspace
  - destination/list pages
  - FleetOps workspace

The biggest product-design takeaway is that the app already has enough structure to polish, but it does **not** yet behave like one tightly unified design system. It is currently a combination of:

- shared shell tokens
- reusable overlay/menu primitives
- page-specific CSS
- module-specific visual languages

That means the next UI/UX phase should focus on consolidation, consistency, and refinement rather than inventing structure from scratch.
