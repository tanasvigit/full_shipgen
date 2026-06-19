# Appointments Module — Live Integration Notes

## API layer

- `appointmentsApi.js` wraps `ymsApi` (no duplicate HTTP client).
- Booking creates a **vehicle** then an **appointment** via `POST /vehicles` and `POST /appointments`.
- Updates use `PATCH /appointments/{id}`; status changes on vehicles use `POST /flow/vehicles/{id}/transition`.

## Field mapping (Book Slot → backend)

| UI field | Backend field |
|----------|----------------|
| Plate, transporter, driver | `vehicles` record |
| Created by | `customer_name` |
| Material + delivery | `shipment_reference` (`Loading\|Material\|Destination`) |
| Pickup/delivery/qty/notes | `remarks` |
| Date + slot | `booking_date`, `reporting_time`, `scheduled_slot` |
| Gate | `gate_number` (auto least-loaded if default) |
| Priority | `priority` (0 / 50 / 90) |

## Status display

Backend uses YMS statuses (`SCHEDULED`, `CHECKED_IN`, `LOADING`, etc.). UI maps:

- `CHECKED_IN` → **ARRIVED**
- Active yard statuses → **IN_PROGRESS**
- Past reporting time + `SCHEDULED` → **DELAYED**

## Actions (Appointment drawer)

- **Arrived** → appointment + vehicle `CHECKED_IN`
- **In progress** → vehicle transition to `LOADING` (requires valid prior status)
- **Complete** → vehicle `COMPLETED`
- **Reschedule** → PATCH date/slot/gate
- **Cancel** → `CANCELLED` on appointment + vehicle when possible

## Limitations

- No dedicated reschedule endpoint — uses `PATCH /appointments`.
- Drag-and-drop timeline reschedule not wired (use drawer Reschedule).
- Dock column shows dock code only after queue check-in assigns a dock.
- Request type stored in `shipment_reference` prefix until a dedicated column exists.

## Sync

After book/update/cancel, the Appointments page reloads. Control Tower refreshes on its own 30s interval; Virtual Queue reloads when opened or after drawer actions.
