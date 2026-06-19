# Gate Management — Live Integration Notes

## API layer

`gateManagementApi.js` wraps `ymsApi`:

| Action | Endpoint / flow |
|--------|------------------|
| Lookup | Client search over vehicles + appointments |
| Approve check-in | `POST /flow/check-in` → queue entry + yard events |
| Reject | `PATCH /appointments` → `CANCELLED` + `GATE_REJECTED` yard event + vehicle transition |
| Mark arrived | `CHECKED_IN` on appointment/vehicle (pre-validation) |

## Lookup

Supports plate number, booking reference (`APT-…`), partial match, and simulated QR scan (uses lookup field or next waiting vehicle).

## Validation checks

| Check | Source |
|-------|--------|
| Appointment valid | Backend appointment + status |
| Slot active | Reporting time vs today (derived) |
| Driver KYC | Driver name/phone on vehicle (derived) |
| Permit / pollution / insurance / security | Rule-based; labeled **assumed** |
| Not exited / not checked in | Backend vehicle + queue |
| Gate assignment | `gate_number` vs scanner gate `G1` |

Approve is enabled when no check is **fail** and vehicle is not already queued.

## Gate activity list

Derived from appointments + queue + yard events:

- approaching · arrived · waiting · approved · checked_in · rejected

## Cross-module sync

`notifyYmsDataChanged()` dispatches `yms-data-changed`; Control Tower and Virtual Queue listen and refresh.

## Limitations

- No hardware QR/ANPR integration (manual + simulated scan only).
- ETA and GPS distance are estimates until telematics exists.
- Document compliance is rule-based, not document storage.
