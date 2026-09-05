#!/usr/bin/env python3
"""Generate a polished PDF for the AI Automation Playbook (3 engines)."""

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "AI-AUTOMATION-PLAYBOOK-3-ENGINES.pdf"
TODAY = date.today().strftime("%B %d, %Y")

# Brand colors
NAVY = colors.HexColor("#0B1F3A")
BLUE = colors.HexColor("#1E6FD9")
TEAL = colors.HexColor("#0D9488")
LIGHT_BG = colors.HexColor("#F4F7FB")
GRAY = colors.HexColor("#64748B")


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=25,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            textColor=GRAY,
            alignment=TA_CENTER,
            spaceAfter=18,
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=GRAY,
            alignment=TA_CENTER,
            spaceAfter=5,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            textColor=NAVY,
            spaceBefore=14,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=BLUE,
            spaceBefore=10,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#1E293B"),
            alignment=TA_JUSTIFY,
            spaceAfter=7,
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
    }


CELL_STYLE = ParagraphStyle(
    "Cell",
    fontName="Helvetica",
    fontSize=8.6,
    leading=11,
    alignment=TA_LEFT,
    textColor=colors.HexColor("#1E293B"),
)

HEADER_CELL_STYLE = ParagraphStyle(
    "HeaderCell",
    fontName="Helvetica-Bold",
    fontSize=8.6,
    leading=11,
    alignment=TA_LEFT,
    textColor=colors.white,
)


def pcell(value, style):
    return Paragraph(value, style) if isinstance(value, str) else value


def make_table(headers, rows, widths):
    data = [[pcell(h, HEADER_CELL_STYLE) for h in headers]]
    data.extend([[pcell(cell, CELL_STYLE) for cell in row] for row in rows])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
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
        canvas.drawString(2 * cm, 1.2 * cm, "Shipgen — AI Automation Playbook (FleetOps + YMS + PMS)")
        canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}")
        canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
        canvas.line(2 * cm, 1.5 * cm, A4[0] - 2 * cm, 1.5 * cm)
    canvas.restoreState()


def build_story(styles):
    s = []

    # Cover
    s.append(Spacer(1, 3.4 * cm))
    s.append(Paragraph("Shipgen Platform", styles["title"]))
    s.append(Paragraph("AI Automation Playbook", styles["title"]))
    s.append(Paragraph("FleetOps + Yard (YMS) + Parking (PMS)", styles["subtitle"]))
    s.append(Spacer(1, 0.5 * cm))
    s.append(Paragraph("Real User Workflow Perspective", styles["subtitle"]))
    s.append(Spacer(1, 0.7 * cm))
    s.append(
        Paragraph(
            f"<b>Version:</b> 1.0 &nbsp;&nbsp;|&nbsp;&nbsp; <b>Date:</b> {TODAY}",
            styles["cover_meta"],
        )
    )
    s.append(Paragraph("<b>Prepared for:</b> Shipgen Product & Operations Teams", styles["cover_meta"]))
    s.append(Paragraph("<b>Purpose:</b> Identify high-impact manual workflows to automate with AI", styles["cover_meta"]))
    s.append(Spacer(1, 1.4 * cm))
    s.append(HRFlowable(width="80%", thickness=2, color=TEAL, spaceBefore=10, spaceAfter=10))
    s.append(
        Paragraph(
            "This playbook outlines where AI can reduce repetitive manual work across all three core engines, "
            "improve decision speed, and create measurable operational impact.",
            styles["body"],
        )
    )
    s.append(PageBreak())

    # Why it matters
    s.append(Paragraph("1. Why This Matters (As a Real User)", styles["h1"]))
    s.append(
        Paragraph(
            "Operational users do not experience 'modules'; they experience interruptions, rework, and delay. "
            "AI should reduce repetitive effort and improve decision quality at the point of work.",
            styles["body"],
        )
    )
    for item in [
        "I re-enter the same data in multiple places.",
        "I spend too much time following up status manually.",
        "I detect exceptions late and escalate reactively.",
        "Shift handover reports consume high-value supervision time.",
        "Under pressure, avoidable mistakes happen in assignment and verification.",
    ]:
        s.append(Paragraph(f"• {item}", styles["bullet"]))

    s.append(Spacer(1, 0.2 * cm))
    s.append(Paragraph("AI should act as an operations co-pilot:", styles["h2"]))
    for item in [
        "Prefill and validate before submission.",
        "Recommend next-best actions with rationale.",
        "Automate routine communication updates.",
        "Detect SLA and compliance risk early.",
        "Generate shift summaries and action lists automatically.",
    ]:
        s.append(Paragraph(f"• {item}", styles["bullet"]))

    # Cross-family table
    s.append(Spacer(1, 0.2 * cm))
    s.append(Paragraph("2. Cross-Engine Automation Opportunities", styles["h1"]))
    family_rows = [
        ["Workflow Family", "Current Manual Pain", "AI Automation Outcome"],
        [
            "Data entry and form completion",
            "Repeated typing, missing fields, inconsistent data",
            "Context-aware prefill + OCR extraction + policy validation",
        ],
        [
            "Assignment and scheduling",
            "Manual judgment each time under time pressure",
            "Ranked recommendations (driver, dock, queue, slot) with confidence",
        ],
        [
            "Exception handling",
            "Issues discovered late and handled via calls/chats",
            "Early anomaly alerts + guided recovery playbooks",
        ],
        [
            "Status communication",
            "Manual updates to customers/vendors/internal teams",
            "Auto-generated ETAs, delay updates, and completion notifications",
        ],
        [
            "Shift reporting",
            "Manual summaries from multiple screens/spreadsheets",
            "Auto shift brief with KPI movement and unresolved backlog",
        ],
        [
            "Audit and compliance",
            "Supervisors manually verify policy adherence",
            "Continuous rule checks with explainable exception flags",
        ],
    ]
    s.append(make_table(family_rows[0], family_rows[1:], [4.2 * cm, 5.2 * cm, 6.0 * cm]))
    s.append(PageBreak())

    # FleetOps
    s.append(Paragraph("3. FleetOps — Priority Automation Areas", styles["h1"]))
    s.append(Paragraph("3.1 Order intake and dispatch planning", styles["h2"]))
    for item in [
        "<b>Manual today:</b> Dispatcher checks prior jobs, rates, constraints, and driver availability manually.",
        "<b>Automate:</b> Auto-draft orders from messages/docs, suggest service/rate patterns, rank driver recommendations.",
        "<b>Impact:</b> Faster order-to-dispatch cycle and fewer assignment errors.",
    ]:
        s.append(Paragraph(item, styles["body"]))

    s.append(Paragraph("3.2 Live monitoring and exception response", styles["h2"]))
    for item in [
        "<b>Manual today:</b> Teams watch maps and timelines continuously to catch delays.",
        "<b>Automate:</b> Detect route deviation, prolonged stops, and SLA risk; trigger role-specific action cards.",
        "<b>Impact:</b> Earlier intervention and improved customer communication consistency.",
    ]:
        s.append(Paragraph(item, styles["body"]))

    s.append(Paragraph("3.3 POD quality and completion confidence", styles["h2"]))
    for item in [
        "<b>Manual today:</b> POD validation and dispute readiness are mostly post-facto.",
        "<b>Automate:</b> Check signature/photo quality, metadata consistency, and suspicious completion patterns.",
        "<b>Impact:</b> Lower completion disputes and faster billing readiness.",
    ]:
        s.append(Paragraph(item, styles["body"]))

    # YMS
    s.append(Paragraph("4. Yard (YMS) — Priority Automation Areas", styles["h1"]))
    s.append(Paragraph("4.1 Appointment risk and gate decisioning", styles["h2"]))
    for item in [
        "<b>Manual today:</b> Gate teams verify appointment/docs and handle mismatches manually.",
        "<b>Automate:</b> Pre-arrival risk scoring + OCR-assisted validation + allow/hold/escalate recommendations.",
        "<b>Impact:</b> Higher gate throughput with fewer policy violations.",
    ]:
        s.append(Paragraph(item, styles["body"]))

    s.append(Paragraph("4.2 Queue and dock optimization", styles["h2"]))
    for item in [
        "<b>Manual today:</b> Coordinators reprioritize queue and docks reactively.",
        "<b>Automate:</b> Dynamic priority and dock suggestions using SLA, readiness, labor, and cargo constraints.",
        "<b>Impact:</b> Reduced detention and improved dock utilization.",
    ]:
        s.append(Paragraph(item, styles["body"]))

    s.append(Paragraph("4.3 Control tower incident intelligence", styles["h2"]))
    for item in [
        "<b>Manual today:</b> Root cause correlation is fragmented across dashboards.",
        "<b>Automate:</b> Correlate gate, queue, dock, and labor signals into one actionable incident narrative.",
        "<b>Impact:</b> Faster recovery and better shift-level predictability.",
    ]:
        s.append(Paragraph(item, styles["body"]))
    s.append(PageBreak())

    # PMS
    s.append(Paragraph("5. Parking (PMS) — Priority Automation Areas", styles["h1"]))
    s.append(Paragraph("5.1 Entry and occupancy guidance", styles["h2"]))
    for item in [
        "<b>Manual today:</b> Slot guidance and floor balancing rely on operator judgment during peaks.",
        "<b>Automate:</b> Occupancy forecasting by floor/vehicle type and best-slot recommendations.",
        "<b>Impact:</b> Faster entry movement and improved capacity utilization.",
    ]:
        s.append(Paragraph(item, styles["body"]))

    s.append(Paragraph("5.2 Payment and exit assurance", styles["h2"]))
    for item in [
        "<b>Manual today:</b> Exit fee verification and dispute handling consume lane time.",
        "<b>Automate:</b> Explainable payable calculation + anomaly checks for discounts/overrides.",
        "<b>Impact:</b> Lower leakage and quicker exit processing.",
    ]:
        s.append(Paragraph(item, styles["body"]))

    s.append(Paragraph("5.3 Supervisor and revenue intelligence", styles["h2"]))
    for item in [
        "<b>Manual today:</b> Shift summaries and revenue variance checks are manual.",
        "<b>Automate:</b> Auto-generated shift summary, variance analysis, and next-shift action list.",
        "<b>Impact:</b> Better managerial control with less report preparation effort.",
    ]:
        s.append(Paragraph(item, styles["body"]))

    # Differentiators
    s.append(Paragraph("6. Cross-Engine Differentiators (How Shipgen Stands Out)", styles["h1"]))
    diff_rows = [
        ["Differentiator", "What It Means Practically"],
        [
            "Unified operational co-pilot",
            "One assistant across FleetOps + YMS + PMS that understands dependencies and downstream impact.",
        ],
        [
            "Role-aware intelligence",
            "Same event surfaces different action cards for dispatcher, gate operator, and supervisor.",
        ],
        [
            "End-to-end SLA chain",
            "Track and explain SLA risk across engines instead of isolated module-level alerts.",
        ],
        [
            "Explainable AI audit trail",
            "Every recommendation records signals, rationale, user action, and final outcome.",
        ],
    ]
    s.append(make_table(diff_rows[0], diff_rows[1:], [5.0 * cm, 10.4 * cm]))
    s.append(PageBreak())

    # Roadmap and metrics
    s.append(Paragraph("7. Practical Rollout Roadmap", styles["h1"]))
    roadmap_rows = [
        ["Phase", "Timeline", "Primary Deliverables"],
        [
            "Phase 1",
            "0-6 weeks",
            "Smart prefill, shift summaries, intelligent alert prioritization",
        ],
        [
            "Phase 2",
            "6-12 weeks",
            "Assignment recommendations, delay prediction, auto-communication workflows",
        ],
        [
            "Phase 3",
            "12+ weeks",
            "Cross-engine autonomous orchestration with human approval gates",
        ],
    ]
    s.append(make_table(roadmap_rows[0], roadmap_rows[1:], [2.4 * cm, 2.8 * cm, 10.2 * cm]))

    s.append(Paragraph("8. Suggested Success Metrics", styles["h1"]))
    for item in [
        "30-50% reduction in manual data-entry time.",
        "20-35% reduction in decision cycle time (assignment/escalation).",
        "15-25% reduction in SLA breaches and avoidable delays.",
        "25-40% reduction in shift report preparation effort.",
    ]:
        s.append(Paragraph(f"• {item}", styles["bullet"]))

    s.append(Paragraph("9. Safeguards for Responsible Automation", styles["h1"]))
    for item in [
        "Keep human approval for critical decisions (dispatch lock, gate deny, payment exception override).",
        "Show confidence score + rationale + alternative recommendation options.",
        "Use role-based alert routing to avoid operational alert fatigue.",
        "Run monthly outcome reviews to tune models/rules and prevent drift.",
    ]:
        s.append(Paragraph(f"• {item}", styles["bullet"]))

    s.append(Spacer(1, 0.5 * cm))
    s.append(
        Paragraph(
            f"Generated {TODAY} · AI Automation Playbook v1.0 · Confidential",
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
        title="AI Automation Playbook - FleetOps YMS PMS",
        author="Shipgen Engineering",
    )
    doc.build(build_story(styles), onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF written to: {OUTPUT}")


if __name__ == "__main__":
    main()

