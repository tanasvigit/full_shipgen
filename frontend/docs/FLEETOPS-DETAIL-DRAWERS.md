# FleetOps detail drawers

Enterprise detail UX for drivers, vehicles, fleets, places, and orders opens in a **right-side drawer** (720px on desktop) while list routes stay mounted.

## URL state

| Entity  | Query param   | Example |
|---------|---------------|---------|
| Driver  | `driver`      | `/fleet-ops/management/drivers?driver=drv_123` |
| Vehicle | `vehicle`     | `/fleet-ops/management/vehicles?vehicle=veh_456` |
| Fleet   | `fleet`       | `/fleet-ops/management/fleets?fleet=flt_789` |
| Place   | `place`       | `/fleet-ops/management/places?place=plc_abc` |
| Order   | `order`       | `/fleet-ops/operations/orders?order=ord_xyz` |

Optional tab: `driverTab`, `orderTab`, etc.

Legacy paths `/fleet-ops/.../:id` redirect to the query form via `DetailRouteRedirect`.

## Architecture

```
FleetOpsModuleLayout (Outlet + FleetOpsDetailHost)
  ├── List pages (DriversList, …)
  └── FleetOpsDetailHost
        └── EntityDetailDrawer
              └── *Detail (embedded)
```

- **Registry:** `src/domain/fleetops/detail/registry.js` — widths, params, `registerDetailTabs()` for extensions.
- **Hook:** `src/hooks/fleetops/useFleetopsDetailDrawer.js` — `openDetail`, `closeDetail`, `setDetailTab`, `openRelated`.
- **Shell:** `EntityDetailDrawer`, `DetailDrawerHeader`, `DetailDrawerTabs`, `DetailDrawerLayout`.

## Entity views

Detail pages accept:

```jsx
<DriverDetail embedded entityId={id} activeTab={tab} onTabChange={setTab} onClose={close} />
```

Implemented tabs combine live API data with `DetailPlaceholderTab` for fields still being surfaced. Driver and order drawers have the richest tab sets; other entities follow the same shell.

## Opening from lists

```js
const { openDetail } = useFleetopsDetailDrawer("driver");
openDetail(row.id);
openDetail(row.id, { tab: "orders" });
```

## E2E

- `data-testid`: `driver-detail-page`, `driver-detail-drawer`, `driver-tab-orders`, etc.
- Deep links and `/:id` redirects remain valid for simulations.

## Phase 2 (in progress)

Implemented:

- **API layer:** `detailApi.js`, `getOrderTracker`, `listOrderComments`, scoped `listOrders` params
- **Lazy tabs:** `useDetailTabData` — fetch only when tab is active
- **Driver drawer:** Overview parity grid, orders/positions/schedule/documents/activity/financials tabs (API-backed)
- **Order drawer:** Live tracking (`/orders/:id/tracker`), financials, comments, audit/webhook logs, route summary
- **Vehicle/Fleet/Place:** Removed placeholder tabs; orders, maps, geofence events, field grids
- **Dirty close:** `FleetopsDetailDirtyProvider`, unsaved confirm dialog, edit modal guard
- **Maps:** `MapView.onMarkerClick` — orders map opens order drawer

Still open:

- WebSocket realtime per tab (Ember `order-socket-events` parity)
- Full positions replay UI (channel-based replay job)
- Infinite virtualized timelines
- True form field-level dirty tracking (currently: open edit dialog = dirty)
- Remaining Ember tab depth (order payload, purchase-rate, integrated vendor, etc.)

See `a_uidocs/screens/fleet-ops/MASTER__*.md` for full field parity targets.
