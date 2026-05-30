# Fleetbase global loading system

Enterprise-grade loading infrastructure for the React console (all modules: Console, FleetOps, Storefront, Ledger, IAM, Registry, Pallet, Developers).

## Animation (source of truth)

The visual spec is implemented in `components/loaders/Spinner/ArcSpinner.jsx` + `spinner.css`:

| Requirement | Implementation |
|---------------|----------------|
| SVG arc | Two circles: track + arc (`stroke-dasharray` 94 / 125.66) |
| Rounded cap | `strokeLinecap="round"` |
| Clockwise rotation | CSS `rotate(360deg)` on `.fleetbase-arc-spinner` |
| Seamless loop | Linear 0.9s infinite, transform-only |
| Transform origin | `transform-origin: center` |
| Fade-in | `.fleetbase-loader-fade-in` 220ms |
| No pulse/scale | Transform-only animation |
| GPU | `will-change: transform` on inner SVG only (host wrapper is fixed size) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables spin |
| Themes | CSS vars `--loader-arc`, `--loader-track`, `--loader-overlay` |
| Viewport center | Boot splash uses inline CSS in `index.html` (Tailwind is not loaded yet). App overlays use `.fleetbase-loader-viewport` (`position: fixed`, flex center). |

## Architecture

```txt
services/loading-manager.js     # Debounce, min visible, API/route/bootstrap tokens
providers/LoadingProvider.jsx   # Global UI + route watcher
hooks/
  useLoadingState.js            # Scoped keys
  useGlobalLoader.js            # Fullscreen/global API
  usePageLoader.js              # Page section run/start/stop
components/loaders/
  Spinner/ArcSpinner.jsx
  overlays/                     # global, page, section, fullscreen
  transitions/                  # Suspense fallback (top progress bar removed — redundant with centered loader)
  Skeleton/LoaderSkeleton.jsx   # table, card, detail, chart, …
  indicators/                   # inline, map, search, upload, button
  content/ContentLoaders.jsx    # PageLoader, TableLoader, …
```

## Loader types

| Category | Component | testId |
|----------|-----------|--------|
| Global bootstrap | `index.html` (inline critical CSS, no Tailwind) + `GlobalLoaderOverlay` | `global-loader` |
| Auth session | `GlobalLoaderOverlay` (auth flag) | `global-loader` |
| Route transition | *(removed)* — use viewport-centered arc overlay / global loader only |
| Page | `PageLoader` / `PageLoaderOverlay` | `page-loader` |
| Table | `TableLoader` + `DataTable` `loading` prop | `{table}-loader` |
| Section/card | `SectionLoaderOverlay`, `CardLoader` | `section-loader` |
| Map | `MapLoader` on `MapView` | `map-loader` |
| Button/form | `LoadingButton`, `FleetOpsFormDialog` | `button-loader-spinner` |
| Specialized | `SpecializedLoader` variants | `{variant}-loader` |
| Skeletons | `*Skeleton` components | `*-skeleton` |

## API integration

`apiClient` interceptors in `lib/api.js` track requests unless `config.loading === false`.

```javascript
await apiClient.get("/orders", { loadingMessage: "Fetching orders…" });
await apiClient.post("/orders", body, { loadingGlobal: true }); // fullscreen message
await apiClient.get("/users/me", { loading: false }); // silent (auth bootstrap)
```

`authorizedHostRequest` supports the same `loading` / `loadingMessage` options.

## UX defaults

- **Debounce:** 220ms before showing API-driven progress
- **Min visible:** 380ms to prevent flash
- **Route min:** 280ms on pathname change
- Contextual messages via `messageForPath()` and per-request `loadingMessage`

## Accessibility

- `role="status"`, `aria-live="polite"`, `aria-busy` on overlays
- `prefers-reduced-motion` disables rotation
- Screen reader labels on global overlay

## Playwright

| Spec | Coverage |
|------|----------|
| `e2e/loading/global-loading.spec.ts` | Global loader dismissal, route navigation, table loader, dialogs |
| `e2e/loading/arc-spinner-animation.spec.ts` | SVG arc structure, CSS animation contract, live rotation, route progress, delayed fetch overlays |

Helpers: `e2e/helpers/loading.ts` — `assertArcSpinnerFully`, `delayFleetOpsListGet`, route progress assertions.

```bash
npm run test:e2e:loading
npm run test:e2e:loading:animation
```

## Usage examples

```jsx
import { PageLoader, TableLoader, LoadingButton, usePageLoader } from "@/components/loaders";

const { loading, run } = usePageLoader("Syncing records…");
await run(() => fleetopsService.listOrders());

<DataTable loading={loading} loadingMessage="Fetching orders…" … />
<MapView loading={mapLoading} … />
<LoadingButton loading={busy}>Save</LoadingButton>
```
