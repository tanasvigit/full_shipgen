#!/usr/bin/env python3
"""Generate Shipgen Product vs Codebase Gap Analysis PDF."""

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT = Path(__file__).resolve().parents[1] / "SHIPGEN-Product-Gap-Analysis.pdf"
TODAY = date.today().strftime("%B %d, %Y")

# Brand colors
NAVY = colors.HexColor("#0B1F3A")
BLUE = colors.HexColor("#1E6FD9")
TEAL = colors.HexColor("#0D9488")
LIGHT_BG = colors.HexColor("#F4F7FB")
GREEN = colors.HexColor("#15803D")
AMBER = colors.HexColor("#B45309")
RED = colors.HexColor("#B91C1C")
GRAY = colors.HexColor("#64748B")


def build_styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=26,
            textColor=NAVY,
            spaceAfter=12,
            alignment=TA_CENTER,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            textColor=GRAY,
            alignment=TA_CENTER,
            spaceAfter=24,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            textColor=NAVY,
            spaceBefore=18,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=BLUE,
            spaceBefore=12,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#1E293B"),
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            leftIndent=14,
            bulletIndent=0,
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=GRAY,
            leading=11,
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=GRAY,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
    }
    return styles


# Paragraph styles used inside table cells so text wraps correctly.
CELL_STYLE = ParagraphStyle(
    "Cell",
    fontName="Helvetica",
    fontSize=8,
    leading=10.5,
    textColor=colors.HexColor("#1E293B"),
    alignment=TA_LEFT,
)
HEADER_CELL_STYLE = ParagraphStyle(
    "HeaderCell",
    fontName="Helvetica-Bold",
    fontSize=8.5,
    leading=11,
    textColor=colors.white,
    alignment=TA_LEFT,
)
STATUS_CELL_STYLE = ParagraphStyle(
    "StatusCell",
    fontName="Helvetica-Bold",
    fontSize=8,
    leading=10.5,
    alignment=TA_CENTER,
)

_STATUS_COLORS = {
    "Complete": "#15803D",
    "Partial": "#B45309",
    "Not Started": "#B91C1C",
    "Out of Scope": "#475569",
}


def status_cell(status: str):
    """Return a Paragraph with a colored status label."""
    fg = _STATUS_COLORS.get(status, "#475569")
    return Paragraph(f'<font color="{fg}"><b>{status}</b></font>', STATUS_CELL_STYLE)


def _to_cell(value, style):
    """Wrap plain strings in a Paragraph; leave existing flowables untouched."""
    if isinstance(value, str):
        return Paragraph(value, style)
    return value


def make_table(headers, rows, col_widths=None):
    header_cells = [_to_cell(h, HEADER_CELL_STYLE) for h in headers]
    body = [[_to_cell(c, CELL_STYLE) for c in row] for row in rows]
    data = [header_cells] + body
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, NAVY),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(GRAY)
        canvas.drawString(2 * cm, 1.2 * cm, "Shipgen — Product vs Codebase Gap Analysis")
        canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}")
        canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
        canvas.line(2 * cm, 1.5 * cm, A4[0] - 2 * cm, 1.5 * cm)
    canvas.restoreState()


def build_story(styles):
    s = []
    # Cover
    s.append(Spacer(1, 3.5 * cm))
    s.append(Paragraph("Shipgen Platform", styles["title"]))
    s.append(Paragraph("Product Vision vs Codebase<br/>Implementation Gap Analysis", styles["title"]))
    s.append(Spacer(1, 0.4 * cm))
    s.append(Paragraph("AI-Powered Smart Logistics Operations Platform", styles["subtitle"]))
    s.append(Spacer(1, 1.2 * cm))
    s.append(
        Paragraph(
            f"<b>Document Version:</b> 1.0 &nbsp;&nbsp;|&nbsp;&nbsp; <b>Date:</b> {TODAY}",
            styles["cover_meta"],
        )
    )
    s.append(Paragraph("<b>Prepared for:</b> Shigen / Shipgen Project Team", styles["cover_meta"]))
    s.append(Paragraph("<b>Source:</b> Finalized product deck + Fleetbase codebase audit", styles["cover_meta"]))
    s.append(Spacer(1, 2 * cm))
    s.append(HRFlowable(width="80%", thickness=2, color=BLUE, spaceBefore=10, spaceAfter=10))
    s.append(
        Paragraph(
            "This document compares the finalized product vision (10-slide deck) against the "
            "current Shipgen codebase to identify completed capabilities, partial implementations, "
            "and gaps requiring future development.",
            styles["body"],
        )
    )
    s.append(PageBreak())

    # Executive Summary
    s.append(Paragraph("1. Executive Summary", styles["h1"]))
    s.append(
        Paragraph(
            "Shipgen is positioned in the product deck as a unified, AI-native logistics platform "
            "with three intelligent engines — <b>FleetOps</b>, <b>Yard OS</b>, and <b>Tollgate OS</b> — "
            "powered by a centralized AI Engine. The current codebase delivers a <b>substantial operational "
            "foundation</b> built on Fleetbase with embedded Yard (YMS) and Parking (PMS) modules, "
            "web console, and mobile apps.",
            styles["body"],
        )
    )
    s.append(
        Paragraph(
            "<b>Key finding:</b> Core operational workflows across fleet, yard, and parking are largely "
            "implemented. The primary gap is between <b>marketing AI capabilities</b> (predictive ML, NLP "
            "copilot, fraud AI, auto-dispatch) and <b>actual implementation</b> (rule-based heuristics, "
            "VROOM/OSRM optimization, EasyOCR plate recognition, manual gate workflows).",
            styles["body"],
        )
    )

    summary_rows = [
        ["Platform Area", "Vision Scope", "Implementation", "Completion"],
        [
            "Unified Platform (Single Login)",
            "One login, role-based access across modules",
            "React console + IAM + engine switcher",
            status_cell("Complete"),
        ],
        [
            "FleetOps Engine",
            "AI route, driver, maintenance, GPS, POD",
            "Full FleetOps + orchestrator; heuristic (not ML) AI",
            status_cell("Partial"),
        ],
        [
            "Yard OS Engine",
            "AI queue, dock, labor, OCR gate, heatmap",
            "Full 15-status lifecycle; rule-based recommendations",
            status_cell("Partial"),
        ],
        [
            "Tollgate OS Engine",
            "ANPR, fraud AI, barrier automation, digital toll",
            "Parking PMS: ticketing, OCR upload, manual ops",
            status_cell("Partial"),
        ],
        [
            "Central AI Engine",
            "Predictive analytics, NLP Q&A, cross-module insights",
            "Not implemented; rule-based alerts only",
            status_cell("Not Started"),
        ],
        [
            "End-to-End Lifecycle",
            "14-step digitized supply chain",
            "Steps 1–13 largely covered; cross-engine automation partial",
            status_cell("Partial"),
        ],
        [
            "Mobile + Web",
            "Role-based field and floor apps",
            "Expo driver app + YMS mobile roles",
            status_cell("Complete"),
        ],
        [
            "Enterprise / API",
            "API-first, on-prem, audit, compliance",
            "REST APIs, webhooks, audit trails, Docker on-prem",
            status_cell("Complete"),
        ],
        [
            "Supporting Engines",
            "Storefront, Ledger, Pallet, Registry",
            "Full backend + console UI present",
            status_cell("Complete"),
        ],
    ]
    s.append(make_table(summary_rows[0], summary_rows[1:], [3.2 * cm, 4.2 * cm, 5.5 * cm, 2.6 * cm]))
    s.append(Spacer(1, 0.3 * cm))
    s.append(
        Paragraph(
            "<b>Overall estimated completion vs product vision:</b> ~72% operational foundation, "
            "~35% AI-native vision as marketed in the deck.",
            styles["body"],
        )
    )
    s.append(PageBreak())

    # Methodology
    s.append(Paragraph("2. Analysis Methodology", styles["h1"]))
    for item in [
        "<b>Product source:</b> Finalized Canva deck — _AI-Powered-Smart-Logistics-Operations-Platform_.pdf (10 slides, July 2026).",
        "<b>Technical source:</b> Fleetbase monorepo audit — Laravel packages, YMS FastAPI, Parking FastAPI, React console, Expo mobile.",
        "<b>Reference BRD:</b> docs/SHIPGEN-BRD.md v2.0 (June 2026) — authoritative business requirements.",
        "<b>Status definitions:</b> Complete = production-ready end-to-end; Partial = core exists but vision gaps remain; Not Started = no meaningful implementation; Out of Scope = explicitly deferred per BRD.",
    ]:
        s.append(Paragraph(f"• {item}", styles["bullet"]))
    s.append(Spacer(1, 0.2 * cm))
    s.append(Paragraph("3. Platform Architecture", styles["h1"]))
    s.append(
        Paragraph(
            "The product deck describes a three-layer architecture: Single Login → Operational Modules "
            "(FleetOps, Yard OS, Tollgate OS) → AI & Insights. The codebase maps as follows:",
            styles["body"],
        )
    )
    arch_rows = [
        ["Vision Layer", "Codebase Mapping", "Status"],
        ["Single Login + RBAC", "core-api auth, IAM, 2FA, org switching, engine switcher", status_cell("Complete")],
        ["FleetOps", "packages/fleetops + frontend /fleet-ops/* + mobile driver module", status_cell("Complete")],
        ["Yard OS", "yms/ FastAPI + frontend /yard/* + mobile (yard)/*", status_cell("Complete")],
        ["Tollgate OS", "Parking management/ → embedded /parking/* (PMS)", status_cell("Partial")],
        ["AI & Insights Layer", "Rule-based YMS alerts; no central AI engine or NLP", status_cell("Not Started")],
        ["REST APIs + IoT readiness", "1,350+ endpoints, telematics webhooks, device APIs", status_cell("Complete")],
        ["Cloud / On-prem deploy", "Docker, OSRM, gateway, ON-PREM docs", status_cell("Complete")],
    ]
    s.append(make_table(arch_rows[0], arch_rows[1:], [3.5 * cm, 8.5 * cm, 3.5 * cm]))
    s.append(PageBreak())

    # FleetOps
    s.append(Paragraph("4. Module 01 — FleetOps (Intelligent Fleet Management)", styles["h1"]))
    s.append(
        Paragraph(
            "Product vision: AI route optimization, AI driver recommendation, predictive maintenance, "
            "live GPS & digital POD. Workflow: Plan → Track → Predict → Confirm.",
            styles["body"],
        )
    )
    fleet_rows = [
        ["Feature (Product Deck)", "Implementation Evidence", "Status", "Gap Notes"],
        [
            "Order management & dispatch",
            "OrderController, dispatch/bulk-dispatch, order board Kanban",
            status_cell("Complete"),
            "Full lifecycle with workflow engine",
        ],
        [
            "AI Route Optimization",
            "OSRM.php routing + VroomOrchestrationEngine VRP solver",
            status_cell("Partial"),
            "Algorithmic VRP, not ML; no live traffic AI",
        ],
        [
            "AI Driver Recommendation",
            "DriverAssignmentEngine (greedy best-fit: skills, geo, shift)",
            status_cell("Partial"),
            "Heuristic matching, not ML performance model",
        ],
        [
            "Predictive Maintenance",
            "Maintenance schedules, telematics (Samsara/Geotab/Flespi)",
            status_cell("Partial"),
            "Preventive scheduling; no failure prediction ML",
        ],
        [
            "Live GPS Tracking",
            "Driver track API, live coordinates, SocketCluster realtime",
            status_cell("Complete"),
            "Console live map + mobile tracking tab",
        ],
        [
            "Digital POD",
            "capture-signature/photo/qr endpoints + mobile podService",
            status_cell("Complete"),
            "Signature, photo, QR proof capture",
        ],
        [
            "Route planning & orchestrator",
            "Orchestrator workbench, manifests, route sequencing",
            status_cell("Complete"),
            "Greedy + VROOM engines registered",
        ],
        [
            "Driver mobile app",
            "frontend_mobile: orders, workflow, POD, offline queue",
            status_cell("Complete"),
            "50+ screens, E2E tested",
        ],
        [
            "Fleet / vehicle / maintenance mgmt",
            "Drivers, vehicles, fleets, work orders, parts CRUD",
            status_cell("Complete"),
            "145+ FleetOps console pages",
        ],
        [
            "Geofencing & telematics",
            "Geofence events, dwell reports, provider webhooks",
            status_cell("Complete"),
            "Samsara, Geotab, Flespi integrations",
        ],
        [
            "Analytics & reports",
            "SQL report builder, fleet-ops/metrics, custom dashboards",
            status_cell("Complete"),
            "Export CSV/XLSX supported",
        ],
        [
            "Auto-dispatch (40% faster claim)",
            "Manual dispatch + orchestrator commit; no AI auto-dispatch",
            status_cell("Partial"),
            "Deck KPI not yet measurable",
        ],
    ]
    s.append(make_table(fleet_rows[0], fleet_rows[1:], [3.2 * cm, 4.5 * cm, 2.2 * cm, 4.6 * cm]))
    s.append(PageBreak())

    # Yard OS
    s.append(Paragraph("5. Module 02 — Yard OS (Smarter Yard Operations)", styles["h1"]))
    s.append(
        Paragraph(
            "Product vision: AI queue optimization, AI dock allocation, AI labor recommendation, "
            "OCR gate entry, AI yard heatmap. Workflow: Arrival → Queue → Dock → Loading → Exit.",
            styles["body"],
        )
    )
    yard_rows = [
        ["Feature (Product Deck)", "Implementation Evidence", "Status", "Gap Notes"],
        [
            "15-status vehicle lifecycle",
            "yms.py workflow transitions, gate/queue/dock APIs",
            status_cell("Complete"),
            "DRAFT through EXITED per BRD",
        ],
        [
            "Appointments & scheduling",
            "/yard/appointments, calendar, slot booking",
            status_cell("Complete"),
            "Priority scoring implemented",
        ],
        [
            "Gate entry/exit checklists",
            "gate.py: approve/reject, exit verify, audit trail",
            status_cell("Complete"),
            "Digital checklists replace paper",
        ],
        [
            "Virtual queue & priority",
            "queue.py: score = priority×10 + lateness",
            status_cell("Complete"),
            "Supervisor override with audit",
        ],
        [
            "AI Queue Optimization",
            "Deterministic priority formula + rule alerts",
            status_cell("Partial"),
            "Not ML-based reordering",
        ],
        [
            "AI Dock Allocation",
            "Manual/supervisor dock assign + type constraints",
            status_cell("Partial"),
            "No automated AI dock matcher",
        ],
        [
            "AI Labor Recommendation",
            "Labor roster, assign/release, readiness checks",
            status_cell("Partial"),
            "Manual assignment; no AI staffing model",
        ],
        [
            "OCR Gate Entry",
            "Manual plate search + QR; no yard ANPR camera",
            status_cell("Not Started"),
            "OCR exists in Parking module only",
        ],
        [
            "AI Yard Heatmap",
            "Docks schedule heatmap (appointments by hour)",
            status_cell("Partial"),
            "Schedule heatmap, not congestion AI heatmap",
        ],
        [
            "Weighing (tare/gross/net)",
            "queue tare + dock gross weight endpoints",
            status_cell("Complete"),
            "Auto net calculation",
        ],
        [
            "Detention billing",
            "/yard/detention, status workflow, INR costing",
            status_cell("Complete"),
            "Auto-derived from wait/load timing",
        ],
        [
            "Control Tower & alerts",
            "control_tower.py, 9 alert types, 30s refresh",
            status_cell("Complete"),
            "Rule-based, not predictive",
        ],
        [
            "AI Insights / Recommendations",
            "AiInsights.jsx — explicit rule-based mapping",
            status_cell("Partial"),
            "Labeled 'not predictive AI' in code",
        ],
        [
            "Yard map & zone management",
            "/yard/yard, zone occupancy, manual moves",
            status_cell("Complete"),
            "Hazmat zone rules enforced",
        ],
        [
            "Loading ops & exceptions",
            "Start/pause/resume/complete, exception workflow",
            status_cell("Complete"),
            "Resource gating before loading",
        ],
        [
            "YMS mobile (5 roles)",
            "frontend_mobile/(yard)/* gate, queue, docks, etc.",
            status_cell("Complete"),
            "Role-based tabs per BRD",
        ],
        [
            "Yard reports & KPIs",
            "Delay analysis, executive KPIs, PDF export",
            status_cell("Complete"),
            "CSV/XLSX/PDF exports",
        ],
    ]
    s.append(make_table(yard_rows[0], yard_rows[1:], [3.2 * cm, 4.5 * cm, 2.2 * cm, 4.6 * cm]))
    s.append(PageBreak())

    # Tollgate
    s.append(Paragraph("6. Module 03 — Tollgate OS (Frictionless Gate Control)", styles["h1"]))
    s.append(
        Paragraph(
            "Product vision positions Tollgate OS as AI number plate recognition, fraud detection, "
            "digital payments, barrier automation, and real-time lane dashboards. In the codebase, "
            "this maps primarily to the <b>Parking Management System (PMS)</b> embedded at /parking/*.",
            styles["body"],
        )
    )
    toll_rows = [
        ["Feature (Product Deck)", "Implementation Evidence", "Status", "Gap Notes"],
        [
            "Ticket entry & lifecycle",
            "tickets.py: create, pay, exit; Unpaid→Paid→Exited",
            status_cell("Complete"),
            "Full parking ticket workflow",
        ],
        [
            "AI Number Plate Recognition",
            "EasyOCR via image upload (ocr/service.py)",
            status_cell("Partial"),
            "Upload-based OCR; no camera ANPR lane",
        ],
        [
            "AI Fraud Detection",
            "No fraud detection module found",
            status_cell("Not Started"),
            "Duplicate/stolen plate AI not built",
        ],
        [
            "Digital Payments",
            "Cash, UPI, card payment collection",
            status_cell("Complete"),
            "Payment audit trail logged",
        ],
        [
            "Barrier automation",
            "Hardware config UI (mock/seed data); no barrier control",
            status_cell("Not Started"),
            "BRD: monitoring only, automation deferred",
        ],
        [
            "Real-time dashboard",
            "Admin/supervisor/operator dashboards",
            status_cell("Complete"),
            "Occupancy, revenue, traffic KPIs",
        ],
        [
            "Floor & occupancy mgmt",
            "floors.py capacity buckets 2W/4W/heavy",
            status_cell("Complete"),
            "Auto increment/decrement on entry/exit",
        ],
        [
            "Pricing rules",
            "pricing.py per vehicle category",
            status_cell("Complete"),
            "Admin-configured rates",
        ],
        [
            "QR monitoring",
            "QR scan events visible to supervisor",
            status_cell("Complete"),
            "Live scan event stream",
        ],
        [
            "Role-based access (3 roles)",
            "Admin, supervisor, operator route guards",
            status_cell("Complete"),
            "SSO from Shipgen console",
        ],
        [
            "Reports & admin PDF export",
            "Revenue, traffic, category reports",
            status_cell("Complete"),
            "Admin PDF export tier",
        ],
        [
            "Security & compliance audit",
            "audit.py event logging",
            status_cell("Complete"),
            "Ticket/payment/pricing changes logged",
        ],
    ]
    s.append(make_table(toll_rows[0], toll_rows[1:], [3.2 * cm, 4.5 * cm, 2.2 * cm, 4.6 * cm]))
    s.append(PageBreak())

    # AI Engine
    s.append(Paragraph("7. Central AI Engine & Cross-Module Intelligence", styles["h1"]))
    ai_rows = [
        ["Feature (Product Deck)", "Status", "Notes"],
        ["Centralized AI Engine across all modules", status_cell("Not Started"), "No shared ML/AI service layer"],
        ["'Ask Your AI Anything' NLP interface", status_cell("Not Started"), "No LLM integration in codebase"],
        ["Predictive analytics & risk detection", status_cell("Not Started"), "Explicitly out of scope in BRD §22"],
        ["Automated recommendations (ML)", status_cell("Partial"), "Rule-based alert→action mapping in YMS"],
        ["Fuel consumption anomaly detection", status_cell("Not Started"), "Fuel reports exist; no AI anomaly"],
        ["Executive decision intelligence", status_cell("Partial"), "KPI dashboards on-screen; no AI copilot"],
        ["Cross-engine data pipeline to AI", status_cell("Partial"), "Separate DBs per engine; no unified AI lake"],
    ]
    s.append(make_table(ai_rows[0], ai_rows[1:], [4.5 * cm, 2.5 * cm, 8.5 * cm]))
    s.append(Spacer(1, 0.3 * cm))
    s.append(Paragraph("8. End-to-End Workflow (14 Steps)", styles["h1"]))
    e2e_rows = [
        ["Step", "Workflow Stage", "Engine", "Status"],
        ["1", "Customer Order", "Storefront / FleetOps", status_cell("Complete")],
        ["2", "Fleet Planning", "FleetOps orchestrator", status_cell("Complete")],
        ["3", "Driver Assignment", "FleetOps dispatch", status_cell("Complete")],
        ["4", "Vehicle Tracking", "FleetOps + mobile GPS", status_cell("Complete")],
        ["5", "Yard Appointment", "YMS appointments", status_cell("Complete")],
        ["6", "Gate Entry", "YMS gate module", status_cell("Complete")],
        ["7", "Dock Allocation", "YMS docks", status_cell("Complete")],
        ["8", "Loading", "YMS loading ops", status_cell("Complete")],
        ["9", "Exit", "YMS gate exit", status_cell("Complete")],
        ["10", "Tollgate Verification", "Parking PMS", status_cell("Partial")],
        ["11", "Delivery", "FleetOps order complete", status_cell("Complete")],
        ["12", "Digital POD", "FleetOps + mobile", status_cell("Complete")],
        ["13", "Invoice", "Ledger invoices from orders", status_cell("Complete")],
        ["14", "Analytics", "Per-engine reports", status_cell("Partial")],
    ]
    s.append(make_table(e2e_rows[0], e2e_rows[1:], [1.2 * cm, 4.5 * cm, 4 * cm, 3.8 * cm]))
    s.append(
        Paragraph(
            "<b>Note:</b> Steps 1–13 operate within individual engines. Automated handoffs between engines "
            "(e.g., FleetOps order triggering yard appointment) require manual coordination today.",
            styles["body"],
        )
    )
    s.append(PageBreak())

    # Supporting modules
    s.append(Paragraph("9. Supporting Platform Modules", styles["h1"]))
    support_rows = [
        ["Module", "Capabilities", "Status"],
        ["Console / IAM", "Dashboard, notifications, users, roles, policies, groups, 2FA", status_cell("Complete")],
        ["Storefront", "Catalog, cart, checkout, customer portal, promotions", status_cell("Complete")],
        ["Ledger", "Invoices, wallets, journals, financial reports, payment gateways", status_cell("Complete")],
        ["Pallet (WMS)", "Warehouses, inventory, purchase/sales orders, audits", status_cell("Complete")],
        ["Developers", "API keys, webhooks, sockets, request logs", status_cell("Complete")],
        ["Registry", "Extension marketplace, install/uninstall, developer accounts", status_cell("Complete")],
        ["Mobile Apps", "Driver + 5 yard roles, offline queue, realtime", status_cell("Complete")],
        ["On-prem / Docker", "OSRM, tiles, gateway, installer", status_cell("Complete")],
    ]
    s.append(make_table(support_rows[0], support_rows[1:], [3 * cm, 9.5 * cm, 3 * cm]))

    s.append(Paragraph("10. Business Impact Claims vs Reality", styles["h1"]))
    impact_rows = [
        ["Deck Claim", "Current State", "Assessment"],
        ["40% faster dispatch", "Manual + orchestrator dispatch", status_cell("Partial")],
        ["60% less manual work", "Digital workflows replace paper in yard/fleet", status_cell("Partial")],
        ["30% lower fuel cost", "Route optimization via OSRM/VROOM", status_cell("Partial")],
        ["50% reduced waiting time", "Queue priority + SLA alerts", status_cell("Partial")],
        ["99% process visibility", "Audit trails + live dashboards", status_cell("Complete")],
    ]
    s.append(make_table(impact_rows[0], impact_rows[1:], [3.5 * cm, 5.5 * cm, 3.5 * cm]))
    s.append(
        Paragraph(
            "Quantitative KPI claims in the deck are aspirational targets. The platform provides the "
            "operational instrumentation to measure them, but baseline benchmarks are not yet documented.",
            styles["body"],
        )
    )
    s.append(PageBreak())

    # Gap roadmap
    s.append(Paragraph("11. Prioritized Gap Roadmap", styles["h1"]))
    s.append(Paragraph("11.1 High Priority — Align Product Story with Delivery", styles["h2"]))
    roadmap_high = [
        ["#", "Gap", "Recommended Action", "Effort"],
        ["1", "Central AI Engine / NLP copilot", "Define MVP: rule-based Q&A over metrics first; LLM phase 2", "High"],
        ["2", "Yard OCR gate entry", "Reuse Parking EasyOCR service at YMS gate", "Medium"],
        ["3", "Cross-engine automation", "FleetOps→YMS appointment trigger; detention→Ledger invoice", "Medium"],
        ["4", "AI positioning clarity", "Rebrand heuristic features or invest in ML models", "Low"],
        ["5", "Tollgate fraud detection", "Duplicate plate rules + alert workflow", "Medium"],
    ]
    s.append(make_table(roadmap_high[0], roadmap_high[1:], [0.8 * cm, 4 * cm, 7.5 * cm, 2.2 * cm]))

    s.append(Paragraph("11.2 Medium Priority — Vision Enhancement", styles["h2"]))
    roadmap_med = [
        ["#", "Gap", "Recommended Action", "Effort"],
        ["6", "Predictive maintenance ML", "Telematics feature pipeline + anomaly model", "High"],
        ["7", "AI auto-dispatch", "Orchestrator auto-commit with dispatcher approval gate", "Medium"],
        ["8", "Yard congestion heatmap", "Real-time zone occupancy visualization layer", "Medium"],
        ["9", "ANPR camera integration", "Hardware adapter for barrier lanes", "High"],
        ["10", "Unified analytics lake", "Cross-engine ETL for executive AI insights", "High"],
    ]
    s.append(make_table(roadmap_med[0], roadmap_med[1:], [0.8 * cm, 4 * cm, 7.5 * cm, 2.2 * cm]))

    s.append(Paragraph("11.3 Explicitly Out of Scope (per BRD)", styles["h2"]))
    for item in [
        "Full ERP replacement",
        "Carrier self-service booking portal",
        "Multi-facility enterprise tenancy",
        "Customer-facing yard tracking portal",
        "Advanced OR/TMS solver beyond VROOM",
    ]:
        s.append(Paragraph(f"• {item}", styles["bullet"]))

    s.append(PageBreak())

    # Acceptance criteria
    s.append(Paragraph("12. BRD Acceptance Criteria Status", styles["h1"]))
    ac_rows = [
        ["Criteria Area", "Key Test", "Status"],
        ["Platform", "Yard-only user cannot open FleetOps", status_cell("Complete")],
        ["Platform", "Parking-only user cannot open Yard", status_cell("Complete")],
        ["Platform", "Shipgen admin sees all engines", status_cell("Complete")],
        ["FleetOps", "Driver sees assigned order on mobile", status_cell("Complete")],
        ["FleetOps", "Driver cannot skip workflow step", status_cell("Complete")],
        ["FleetOps", "POD appears on console order detail", status_cell("Complete")],
        ["Yard", "Appointment→gate→queue without re-entry", status_cell("Complete")],
        ["Yard", "Call in→dock→labor→loading chain enforced", status_cell("Complete")],
        ["Yard", "Loading complete→exit holding auto", status_cell("Complete")],
        ["Yard", "Exit checklist blocks verify", status_cell("Complete")],
        ["Yard", "Tare/gross/net weights correct", status_cell("Complete")],
        ["Yard", "Detention on exceeded free time", status_cell("Complete")],
        ["Yard", "Wait>60min alert fires", status_cell("Complete")],
        ["Yard", "Mobile gate entry from phone", status_cell("Complete")],
        ["Parking", "Ticket entry increments occupancy", status_cell("Complete")],
        ["Parking", "Exit decrements occupancy", status_cell("Complete")],
        ["Parking", "Revenue report matches payments", status_cell("Complete")],
        ["Reporting", "CSV export matches filtered list", status_cell("Complete")],
    ]
    s.append(make_table(ac_rows[0], ac_rows[1:], [3.5 * cm, 7.5 * cm, 3.5 * cm]))
    s.append(
        Paragraph(
            "<b>BRD acceptance criteria:</b> 18 of 18 checked items have corresponding implementation. "
            "Product deck AI features extend beyond BRD scope.",
            styles["body"],
        )
    )

    s.append(Paragraph("13. Conclusion", styles["h1"]))
    s.append(
        Paragraph(
            "The Shipgen codebase is a <b>mature multi-engine logistics platform</b> with strong coverage of "
            "operational requirements defined in SHIPGEN-BRD.md. FleetOps, Yard OS, and Parking (Tollgate) "
            "modules are production-grade with web and mobile clients, comprehensive APIs, audit trails, "
            "and role-based access.",
            styles["body"],
        )
    )
    s.append(
        Paragraph(
            "The gap between the <b>product deck vision</b> and <b>current implementation</b> is concentrated "
            "in AI-native capabilities: predictive analytics, NLP copilot, fraud AI, automated gate/barrier "
            "systems, and cross-module intelligence. These are either not started or implemented as "
            "rule-based/heuristic alternatives. Closing this gap is primarily a product positioning and "
            "AI engineering investment — not a greenfield platform build.",
            styles["body"],
        )
    )

    s.append(Spacer(1, 0.5 * cm))
    s.append(Paragraph("Appendix A — Key Codebase Paths", styles["h1"]))
    paths = [
        ("Backend API", "packages/core-api, packages/fleetops, packages/ledger, packages/storefront, packages/pallet"),
        ("Yard (YMS)", "yms/backend/routers/, yms/frontend_1/src/"),
        ("Parking (PMS)", "Parking management/backend/, Parking management/frontend/"),
        ("Web Console", "frontend/src/ (436+ route screens)"),
        ("Mobile", "frontend_mobile/frontend/ (Expo, 50+ screens)"),
        ("Business Requirements", "docs/SHIPGEN-BRD.md"),
        ("Technical Specs", "documents/LOW-LEVEL-REQUIREMENTS.md, documents/BACKEND-LOW-LEVEL-REQUIREMENTS.md"),
        ("Product Deck", "ppt/_AI-Powered-Smart-Logistics-Operations-Platform_.pdf"),
    ]
    path_rows = [["Component", "Path"]] + [[a, b] for a, b in paths]
    s.append(make_table(path_rows[0], path_rows[1:], [3.5 * cm, 12 * cm]))

    s.append(Spacer(1, 1 * cm))
    s.append(
        Paragraph(
            f"Generated {TODAY} · Shipgen Product Gap Analysis v1.0 · Confidential",
            styles["small"],
        )
    )
    return s


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Shipgen Product Gap Analysis",
        author="Shipgen Engineering",
    )
    doc.build(build_story(styles), onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF written to: {OUTPUT}")


if __name__ == "__main__":
    main()
