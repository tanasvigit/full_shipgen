# Enterprise AI Layer Placement Audit (Existing Product Only)

## Source-of-Truth Constraint
- This document maps AI only to already implemented screens/routes/modules/APIs in current code.
- No new modules, no workflow redesign, no speculative product ideas.

## Direct CEO Answer
If an AI layer is added today, it should sit in four existing layers:
1. **Screen layer** (assist/coplay/automation hooks inside current pages)
2. **Service client layer** (existing frontend service/API call wrappers)
3. **Existing backend decision points** (current controllers/routers/services)
4. **Existing reporting/monitoring pipelines** (already implemented dashboards, events, reports)

Evidence anchors:
- FleetOps and platform routes: `frontend/src/App.jsx`
- Yard routes: `frontend/src/layouts/YardModuleLayout.jsx`
- Parking routes: `Parking management/frontend/src/ParkingAppRoutes.tsx`
- FleetOps workflows/APIs: `packages/fleetops/server/src/routes.php`
- YMS API composition: `yms/backend/server.py`
- PMS API composition: `Parking management/backend/app/main.py`, `Parking management/backend/app/api/routers/__init__.py`

---

## FleetOps

### Existing Screen -> Manual Work -> AI Layer -> Expected Result

### A. Orders List (`/fleet-ops/operations/orders`)
1. Current Purpose: operational order queue management.
2. Current Workflow: query -> filter/search -> open order -> dispatch/schedule/start/cancel/complete.
3. Current Manual Work: triage and SLA risk spotting across many rows.
4. Human Decisions: dispatch priority, escalation timing.
5. Time Consuming Activities: exception scanning + reprioritization.
6. Can AI help? **YES**
- Why: already central decision screen.
- What AI should do:
  - L1 Assistant: summarize high-risk rows.
  - L2 Copilot: rank dispatch priorities with rationale.
  - L3 Predictive: delay/SLA breach probability.
  - L4 Automation: trigger pre-escalation notifications for critical risk.
  - L5 Agent: Dispatcher Agent for shift queue optimization.
- Expected Result: faster triage and better prioritization.
- Manual Work Reduction: **30-45%**
- Complexity: **Medium**

### B. Order New (`/fleet-ops/operations/orders/new`)
- Current Manual Work: repetitive field input and correction loops.
- Can AI help? **YES**
- AI layer:
  - L1: field auto-fill from prior order/customer context.
  - L2: missing/invalid field guidance before submit.
  - L4: auto-validation checks before final create.
- Expected Result: reduced order creation time and validation errors.
- Reduction: **35-50%**
- Complexity: **Medium**

### C. Order Detail (`/fleet-ops/operations/orders/:id`)
- Current Manual Work: deciding next action from timeline/proofs/activity.
- Can AI help? **YES**
- AI layer:
  - L2: next-best action recommendation.
  - L3: completion and delay-risk prediction.
  - L4: auto-drafted status communication text.
- Expected Result: faster exception handling.
- Reduction: **25-40%**
- Complexity: **Medium**

### D. Routes / Routing (`/fleet-ops/operations/routes*`)
- Current Manual Work: compare route choices manually.
- Can AI help? **YES**
- AI layer: L2 recommendation + L3 ETA variance prediction.
- Expected Result: faster route decision confidence.
- Reduction: **20-35%**
- Complexity: **Medium**

### E. Orchestrator (`/fleet-ops/operations/orchestrator`)
- Current Manual Work: interpreting run/preview/commit outcomes.
- Can AI help? **YES** (existing orchestrator endpoints present)
- AI layer:
  - L2: explain run trade-offs.
  - L3: post-commit risk projection.
  - L4: auto-flag unsafe commits for review.
- Expected Result: safer and faster commit decisions.
- Reduction: **20-30%**
- Complexity: **High**

### F. Schedule Planner (`/fleet-ops/operations/schedule`)
- Current Manual Work: balancing time windows and conflicts.
- Can AI help? **YES**
- AI layer: L2 conflict-aware scheduling suggestions + L3 missed-window predictions.
- Expected Result: lower scheduling rework.
- Reduction: **25-35%**
- Complexity: **High**

### G. Management Screens (drivers/vehicles/fleets/vendors/contacts/issues/fuel/customers)
- Current Manual Work: cross-entity checks and assignment readiness.
- Can AI help? **YES**
- AI layer:
  - L1 data quality highlights.
  - L2 assignment suitability recommendations.
  - L3 availability/downtime risk signals.
- Expected Result: fewer manual checks.
- Reduction: **20-35%**
- Complexity: **Medium**

### H. Connectivity Screens (telematics/devices/sensors/events/tracking)
- Current Manual Work: event stream monitoring and incident triage.
- Can AI help? **YES**
- AI layer:
  - L2 anomaly triage.
  - L3 device/failure and tracking-gap prediction.
  - L4 automatic high-severity notification.
- Expected Result: faster incident response.
- Reduction: **25-40%**
- Complexity: **High**

### I. Maintenance Screens (calendar/schedules/records/work-orders/equipment/parts)
- Current Manual Work: preventive prioritization and work-order interpretation.
- Can AI help? **YES**
- AI layer:
  - L2 maintenance priority recommendation.
  - L3 failure-risk scoring.
  - L4 auto-generated work-order summaries/email drafts.
- Expected Result: lower manual planning burden.
- Reduction: **25-40%**
- Complexity: **High**

### J. Analytics Screens (`/fleet-ops/analytics/reports*`)
- Current Manual Work: query/report interpretation and repeated narrative writing.
- Can AI help? **YES**
- AI layer:
  - L1 summary generation.
  - L2 variance explanation.
  - L4 automatic report narrative generation.
  - L5 Executive Copilot briefing.
- Expected Result: faster decision-ready reporting.
- Reduction: **35-55%**
- Complexity: **Medium-High**

### K. Admin utility screens (tracking lookup, warranties, manifests, payloads, entities, proofs, tracking numbers/status)
- Current Manual Work: detailed consistency checks and trace lookup.
- Can AI help? **YES**
- AI layer: L1 smart search + L2 discrepancy flagging.
- Expected Result: faster traceability.
- Reduction: **20-35%**
- Complexity: **Medium**

---

## FleetOps Module AI Opportunity Map
- AI Assistant: auto-fill, search summarization, proof/log summaries.
- AI Copilot: dispatch/routing/orchestrator guidance.
- AI Recommendation Engine: assignment prioritization and conflict resolution.
- AI Prediction: ETA, delay, SLA breach, maintenance risk.
- AI Automation: notifications/escalations/report narratives.
- AI Monitoring: telematics/device anomaly triage.
- AI Analytics: variance explanations across metrics/reports.
- AI Report Generation: periodic operational and executive summaries.

---

## YMS

Yard routes implemented in `YardModuleLayout.jsx`:
- index dashboard, appointments, gate, queue, yard, docks, vehicles, loading, detention, equipment, labor, ai, kpis, operations-dashboard, reports/delay-analysis, settings, admin/users, admin/roles.
YMS backend routers in `yms/backend/server.py`:
- auth, search, status, yms, yard, queue, gate, reports, control_tower, loading_ops, admin.

### Existing Screen -> Manual Work -> AI Layer -> Expected Result

### A. Dashboard (Control Tower)
- Manual Work: multi-signal incident detection.
- Human Decisions: what to escalate first.
- Can AI help? **YES**
- AI layer:
  - L2 incident prioritization copilot.
  - L3 congestion/SLA-risk prediction.
  - L4 auto-escalation suggestions.
  - L5 Yard Supervisor Agent.
- Reduction: **30-45%**
- Complexity: **High**

### B. Appointments
- Manual Work: readiness checks and conflict handling.
- Can AI help? **YES**
- AI layer: L1 missing-data flags + L2 reschedule guidance + L3 no-show/late risk.
- Reduction: **25-40%**
- Complexity: **Medium**

### C. Gate
- Manual Work: entry/exit validation under throughput pressure.
- Can AI help? **YES**
- AI layer:
  - L1 checklist summarization/OCR-assisted review.
  - L2 allow/hold/escalate suggestion.
  - L4 automatic failed-check escalation.
- Reduction: **30-45%**
- Complexity: **Medium-High**

### D. Virtual Queue
- Manual Work: dynamic reprioritization decisions.
- Can AI help? **YES**
- AI layer: L2 priority recommendation + L3 wait/detention risk + L4 auto-priority alerting.
- Reduction: **30-50%**
- Complexity: **High**

### E. Yard Map
- Manual Work: zone utilization and movement choices.
- Can AI help? **YES**
- AI layer: L2 placement suggestions + L3 congestion trends.
- Reduction: **20-35%**
- Complexity: **Medium**

### F. Docks
- Manual Work: dock assignment balancing.
- Can AI help? **YES**
- AI layer: L2 best-dock recommendations + L3 turnaround predictions.
- Reduction: **25-40%**
- Complexity: **High**

### G. Vehicles
- Manual Work: lifecycle transition checks and exception handling.
- Can AI help? **YES**
- AI layer: L2 next-transition guidance + L3 exception risk scoring.
- Reduction: **20-30%**
- Complexity: **Medium**

### H. Loading Ops
- Manual Work: resource blockers and exception resolution.
- Can AI help? **YES**
- AI layer: L2 resolution guidance + L3 completion delay prediction + L4 escalation drafts.
- Reduction: **30-45%**
- Complexity: **High**

### I. Detention
- Manual Work: identifying root causes and corrective action ownership.
- Can AI help? **YES**
- AI layer: L2 root-cause recommendation + L3 cost-risk projection.
- Reduction: **25-35%**
- Complexity: **Medium**

### J. Equipment / Labor
- Manual Work: utilization balancing by shift.
- Can AI help? **YES**
- AI layer: L2 allocation suggestions + L3 bottleneck forecast.
- Reduction: **20-35%**
- Complexity: **Medium**

### K. AI Insights page (`/yard/ai`)
- Manual Work: manual interpretation of insight cards.
- Can AI help? **YES**
- AI layer: strengthen with confidence + ranked actions + auto-follow-up tasks.
- Reduction: **15-30%**
- Complexity: **Medium**

### L. KPIs / Operations Dashboard / Delay Analysis
- Manual Work: converting metrics into action plans.
- Can AI help? **YES**
- AI layer:
  - L1 metric summaries.
  - L2 corrective recommendations.
  - L4 auto-generated shift or delay reports.
  - L5 executive yard briefing.
- Reduction: **35-55%**
- Complexity: **Medium**

### M. Settings / Admin Users / Admin Roles
- Manual Work: policy consistency checks.
- Can AI help? **YES (limited)**
- AI layer: role-permission delta summaries and misconfiguration flags.
- Reduction: **10-20%**
- Complexity: **Low**

### N. Unauthorized/Connect fallback routes
- Can AI help? **NO meaningful AI opportunity.**

---

## YMS Module AI Opportunity Map
- AI Assistant: checklist summaries, report summaries, search helpers.
- AI Copilot: gate/queue/dock/loading decisions.
- AI Recommendation Engine: queue and resource ordering.
- AI Prediction: congestion, delay, detention, throughput.
- AI Automation: escalation notifications and report narratives.
- AI Monitoring: control tower anomaly detection and ranking.
- AI Analytics: KPI variance + root-cause mapping.
- AI Report Generation: delay and operations report narratives.

---

## PMS

Parking routes implemented in `ParkingAppRoutes.tsx` by role:
- Admin: dashboard, users, pricing, parking, parking-floors, reports, hardware, qr-monitoring, audit-logs, settings.
- Supervisor: dashboard, monitoring, parking-floors, vehicle-search, qr-monitoring, reports, operator-activity, recent-tickets.
- Operator: dashboard, occupancy, new-ticket, collect-payment, qr-print, vehicle-search, exit-vehicle, recent-tickets, settings.
PMS backend route groups (`.../api/routers/__init__.py`): auth, users, floors, tickets, ocr, pricing, dashboard, reports, monitoring, hardware, audit-logs.

### Existing Screen -> Manual Work -> AI Layer -> Expected Result

### A. Admin Dashboard
- Manual Work: interpreting multi-metric status quickly.
- Can AI help? **YES**
- AI layer: L1 summary + L2 anomaly flags + L5 executive briefing.
- Reduction: **20-35%**
- Complexity: **Medium**

### B. User Management
- Manual Work: role/permission review.
- Can AI help? **YES (limited)**
- AI layer: L1 permission summaries + L4 over-privilege warning.
- Reduction: **10-20%**
- Complexity: **Low**

### C. Pricing
- Manual Work: pricing consistency and impact checks.
- Can AI help? **YES**
- AI layer: L2 anomaly suggestion + L3 projected revenue impact.
- Reduction: **20-30%**
- Complexity: **Medium**

### D. Parking/Floor Management
- Manual Work: occupancy balancing and floor-level actions.
- Can AI help? **YES**
- AI layer: L2 balancing recommendations + L3 occupancy predictions.
- Reduction: **20-35%**
- Complexity: **Medium**

### E. Reports
- Manual Work: reading and summarizing reports for leadership.
- Can AI help? **YES**
- AI layer: L1 report summary + L4 auto report narrative generation.
- Reduction: **35-50%**
- Complexity: **Medium**

### F. Hardware
- Manual Work: detecting actionable hardware risks.
- Can AI help? **YES**
- AI layer: L2 health triage + L3 failure likelihood.
- Reduction: **20-30%**
- Complexity: **Medium**

### G. QR Monitoring
- Manual Work: scan anomaly spotting.
- Can AI help? **YES**
- AI layer: L1 suspicious pattern summary + L2 risk triage.
- Reduction: **25-40%**
- Complexity: **Medium**

### H. Audit Logs
- Manual Work: forensic pattern tracing.
- Can AI help? **YES**
- AI layer: L1 natural-language query/summary + L2 suspicious chain detection.
- Reduction: **30-50%**
- Complexity: **Medium**

### I. Supervisor Monitoring Stack
- Screens: dashboard/monitoring/reports/operator activity/vehicle search/recent tickets/QR.
- Manual Work: high-volume oversight and incident ordering.
- Can AI help? **YES**
- AI layer: L2 ranked action queue + L3 trend prediction + L4 escalation drafts + L5 parking supervisor agent.
- Reduction: **25-45%**
- Complexity: **Medium-High**

### J. Operator Ticketing/Payment/Exit/Search Stack
- Screens: new-ticket, collect-payment, exit-vehicle, search, recent-tickets, occupancy.
- Manual Work: repetitive entry, payment checks, exit handling.
- Can AI help? **YES**
- AI layer:
  - L1 ticket auto-fill and payment explanation.
  - L2 exit exception guidance.
  - L3 occupancy trend signal.
  - L4 validation automation at data entry.
- Reduction: **20-45%**
- Complexity: **Medium**

### K. Operator/Admin Settings
- Can AI help? **NO meaningful AI opportunity** beyond low-value config summaries.

### L. Login/Unauthorized/Redirect
- Can AI help? **NO meaningful AI opportunity.**

---

## PMS Module AI Opportunity Map
- AI Assistant: ticket auto-fill, search and report summaries.
- AI Copilot: payment/exit and supervisor triage guidance.
- AI Recommendation Engine: floor balancing and action ranking.
- AI Prediction: occupancy and anomaly trend forecasting.
- AI Automation: report narratives, validation checks, escalation drafting.
- AI Monitoring: QR/hardware/audit anomaly prioritization.
- AI Analytics: variance and trend explanation.
- AI Report Generation: admin/supervisor periodic packs.

---

## AI Classification (Levels)

### Level 1 — AI Assistant
- Auto-fill, OCR support, smart search, summaries, communication drafts.
- Best-fit existing screens:
  - FleetOps: Order New, Reports
  - YMS: Appointments, Gate, Delay Analysis
  - PMS: New Ticket, Reports, Audit Logs

### Level 2 — AI Copilot
- Recommendations, decision support, risk triage.
- Best-fit existing screens:
  - FleetOps: Orders, Orchestrator, Maintenance
  - YMS: Queue, Docks, Loading, Control Tower
  - PMS: Supervisor Monitoring, Payment/Exit

### Level 3 — Predictive AI
- ETA/delay/congestion/occupancy/failure predictions.
- Best-fit existing screens:
  - FleetOps: Orders/Tracking/Maintenance
  - YMS: Dashboard/Queue/Docks/Detention
  - PMS: Dashboard/Floor Mgmt/Hardware

### Level 4 — AI Automation
- Automatic notifications/escalations/report generation/validation.
- Best-fit existing screens:
  - FleetOps analytics + order exceptions
  - YMS control tower + delay analysis
  - PMS reporting + monitoring + audit

### Level 5 — Enterprise AI Agents
- Dispatcher Agent (FleetOps)
- Yard Supervisor Agent (YMS)
- Parking Agent (PMS)
- Operations Copilot (cross-engine)
- Executive Copilot (cross-engine reporting)

---

## Enterprise AI Layer Matrix

| Engine | Module | Screen | Manual Work | AI Layer | AI Type | Business Value | Manual Work Reduction | Priority | Development Complexity | Implementation Phase |
|---|---|---|---|---|---|---|---|---|---|---|
| FleetOps | Orders | Orders List | triage and priority decisions | risk-ranked queue + next-action | L2/L3 | faster dispatch | 30-45% | P0 | Medium | Phase 1 |
| FleetOps | Orders | Order New | repetitive data entry | auto-fill + pre-submit validation | L1/L4 | faster clean order creation | 35-50% | P0 | Medium | Phase 1 |
| FleetOps | Orders | Order Detail | exception decisioning | lifecycle copilot + update drafts | L2/L4 | lower response latency | 25-40% | P0 | Medium | Phase 1 |
| FleetOps | Orchestration | Orchestrator | run interpretation | recommendation explainability | L2 | safer commit decisions | 20-30% | P1 | High | Phase 2 |
| FleetOps | Scheduling | Schedule Planner | conflict balancing | conflict-aware suggestions | L2/L3 | fewer reschedules | 25-35% | P1 | High | Phase 2 |
| FleetOps | Connectivity | Telematics/Devices | event triage | anomaly detection + severity routing | L2/L3/L4 | faster incident response | 25-40% | P1 | High | Phase 2 |
| FleetOps | Maintenance | Work orders/schedules | maintenance prioritization | risk-based prioritizer | L2/L3 | reduced downtime | 25-40% | P1 | High | Phase 2 |
| FleetOps | Analytics | Reports | interpretation + narrative writing | automated insight narratives | L1/L4/L5 | faster management reporting | 35-55% | P0 | Medium | Phase 1 |
| YMS | Control Tower | Dashboard | signal interpretation | incident prioritization copilot | L2/L3/L5 | faster yard control | 30-45% | P0 | High | Phase 1 |
| YMS | Appointments | Appointments | readiness checks | missing data + lateness risk | L1/L3 | fewer gate delays | 25-40% | P0 | Medium | Phase 1 |
| YMS | Gate | Gate | checklist decisioning | allow/hold/escalate guidance | L1/L2/L4 | quicker gate throughput | 30-45% | P0 | Medium-High | Phase 1 |
| YMS | Queue | Virtual Queue | reprioritization | dynamic priority recommendations | L2/L3 | reduced waiting and detention | 30-50% | P0 | High | Phase 1 |
| YMS | Docks | Docks | assignment balancing | best dock recommendation | L2/L3 | throughput gains | 25-40% | P1 | High | Phase 2 |
| YMS | Loading | Loading Ops | exception handling | resolution copilot + auto escalation drafts | L2/L4 | faster recovery | 30-45% | P1 | High | Phase 2 |
| YMS | Reporting | Delay Analysis/KPIs | insight extraction | summary + action-list generation | L1/L2/L4 | faster corrective action | 35-55% | P0 | Medium | Phase 1 |
| PMS | Ticketing | New Ticket | repetitive entry | auto-fill + validation | L1/L4 | operator speed | 30-45% | P0 | Medium | Phase 1 |
| PMS | Payments | Collect Payment | payable verification | payment copilot and anomaly flags | L1/L2 | fewer payment errors | 20-30% | P0 | Medium | Phase 1 |
| PMS | Monitoring | Supervisor Monitoring | event triage | ranked supervisory queue | L2/L3 | better operational oversight | 25-45% | P1 | Medium-High | Phase 2 |
| PMS | Reporting | Admin/Supervisor Reports | report interpretation | report narratives and anomaly summary | L1/L4/L5 | faster decision cycles | 35-50% | P0 | Medium | Phase 1 |
| PMS | Audit | Audit Logs/QR Monitoring | forensic review | suspicious sequence summarization | L1/L2 | faster investigations | 30-50% | P1 | Medium | Phase 2 |

---

## Top 20 AI Features for Next 12 Months (Existing Product Only)

1. FleetOps Orders risk-ranking copilot
2. FleetOps Order New auto-fill + validation
3. FleetOps Order Detail next-action copilot
4. FleetOps Reports narrative generator
5. YMS Control Tower incident prioritizer
6. YMS Appointments readiness risk scorer
7. YMS Gate allow/hold/escalate assistant
8. YMS Queue dynamic priority recommender
9. YMS Delay Analysis auto action-list
10. PMS New Ticket auto-fill assistant
11. PMS Collect Payment explainability + anomaly flags
12. PMS Reports auto summary narrative
13. FleetOps telematics anomaly triage
14. FleetOps maintenance risk prioritizer
15. YMS dock recommendation engine
16. YMS loading exception copilot
17. PMS supervisor monitoring risk-ranked queue
18. PMS audit-log suspicious chain summarizer
19. FleetOps orchestrator run explainability panel
20. Executive Copilot weekly cross-engine brief (from existing reports/KPIs)

### Why these 20 first
- They sit on highest manual-effort screens already in production.
- They use existing workflows/APIs without redesign.
- They produce measurable manual-work reduction quickly.
- They provide balanced rollout across FleetOps, YMS, PMS.

---

## Final Placement Statement
The AI layer should be embedded into existing decision-heavy screens and existing service/controller endpoints:
- FleetOps (`/fleet-ops/*` operations, connectivity, maintenance, analytics)
- YMS (`/yard/*` control tower, gate, queue, docks, loading, reports)
- PMS (`/parking/*` ticketing, payment, monitoring, reports, audit)

This placement reduces manual work immediately while preserving the current architecture and modules.
