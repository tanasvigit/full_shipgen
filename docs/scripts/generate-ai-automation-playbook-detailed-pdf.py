#!/usr/bin/env python3
"""Generate a polished PDF for the detailed AI Automation Master Playbook."""

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
OUTPUT = ROOT / "AI-AUTOMATION-PLAYBOOK-3-ENGINES-DETAILED.pdf"
TODAY = date.today().strftime("%B %d, %Y")

NAVY = colors.HexColor("#0B1F3A")
BLUE = colors.HexColor("#1E6FD9")
TEAL = colors.HexColor("#0D9488")
LIGHT_BG = colors.HexColor("#F4F7FB")
GRAY = colors.HexColor("#64748B")
TEXT = colors.HexColor("#1E293B")


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
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
            spaceAfter=15,
        ),
        "meta": ParagraphStyle(
            "Meta",
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
            fontSize=15,
            textColor=NAVY,
            spaceBefore=12,
            spaceAfter=7,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            textColor=BLUE,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=TEXT,
            alignment=TA_JUSTIFY,
            spaceAfter=7,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=13,
            leftIndent=14,
            bulletIndent=0,
            textColor=TEXT,
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


CELL = ParagraphStyle("Cell", fontName="Helvetica", fontSize=8.5, leading=10.7, textColor=TEXT, alignment=TA_LEFT)
HEAD = ParagraphStyle("Head", fontName="Helvetica-Bold", fontSize=8.5, leading=10.7, textColor=colors.white, alignment=TA_LEFT)


def para(v, style):
    return Paragraph(v, style) if isinstance(v, str) else v


def table(headers, rows, widths):
    data = [[para(h, HEAD) for h in headers]] + [[para(c, CELL) for c in row] for row in rows]
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


def footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(GRAY)
        canvas.drawString(2 * cm, 1.2 * cm, "Shipgen — AI Automation Master Playbook (Detailed)")
        canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}")
        canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
        canvas.line(2 * cm, 1.5 * cm, A4[0] - 2 * cm, 1.5 * cm)
    canvas.restoreState()


def story(styles):
    s = []
    s.append(Spacer(1, 3.1 * cm))
    s.append(Paragraph("Shipgen Platform", styles["title"]))
    s.append(Paragraph("AI Automation Master Playbook", styles["title"]))
    s.append(Paragraph("Detailed Edition — FleetOps + Yard (YMS) + Parking (PMS)", styles["subtitle"]))
    s.append(Spacer(1, 0.5 * cm))
    s.append(Paragraph("Real User Workflow Perspective + Implementation Blueprint", styles["subtitle"]))
    s.append(Spacer(1, 0.7 * cm))
    s.append(Paragraph(f"<b>Version:</b> 1.0 &nbsp;&nbsp;|&nbsp;&nbsp; <b>Date:</b> {TODAY}", styles["meta"]))
    s.append(Paragraph("<b>Prepared for:</b> Shipgen Product, Operations, and Engineering Leadership", styles["meta"]))
    s.append(Paragraph("<b>Purpose:</b> Reduce manual work and accelerate decisions with explainable AI", styles["meta"]))
    s.append(Spacer(1, 1.2 * cm))
    s.append(HRFlowable(width="80%", thickness=2, color=TEAL, spaceBefore=10, spaceAfter=10))
    s.append(
        Paragraph(
            "This document translates real user pain into a phased, implementation-ready AI automation program "
            "across FleetOps, YMS, and PMS with measurable business outcomes.",
            styles["body"],
        )
    )
    s.append(PageBreak())

    s.append(Paragraph("1. Executive Summary", styles["h1"]))
    for b in [
        "Users feel interruptions, not modules: repeated entry, delayed decisions, noisy alerts, manual reporting.",
        "The highest ROI AI opportunities are in decision workflows, not static dashboards.",
        "Shipgen's key differentiation is cross-engine orchestration (FleetOps + YMS + PMS), not single-engine optimization.",
        "Start with assistive and explainable AI; scale to guarded automation after trust is established.",
    ]:
        s.append(Paragraph(f"• {b}", styles["bullet"]))

    s.append(Paragraph("2. Cross-Engine Opportunity Matrix", styles["h1"]))
    s.append(
        table(
            ["Workflow Family", "Manual Pain", "AI Outcome", "Priority"],
            [
                ["Data entry & validation", "Repeated typing, missing fields", "Smart prefill + OCR + policy checks", "P0"],
                ["Assignment decisions", "Judgment under pressure", "Ranked recommendations with confidence", "P0"],
                ["Exception handling", "Late detection and fragmented response", "Early anomaly + guided playbooks", "P0"],
                ["Status communication", "Manual multi-party updates", "Auto ETA/delay/completion updates", "P1"],
                ["Shift reporting", "Spreadsheet-heavy handovers", "Auto shift brief + unresolved backlog", "P1"],
                ["Audit/compliance", "Manual policy verification", "Continuous explainable rule checks", "P1"],
            ],
            [4.0 * cm, 4.8 * cm, 5.7 * cm, 1.4 * cm],
        )
    )
    s.append(PageBreak())

    s.append(Paragraph("3. FleetOps Detailed Blueprint", styles["h1"]))
    s.append(Paragraph("3.1 Order Intake Automation", styles["h2"]))
    s.append(Paragraph("<b>Manual:</b> Interpret customer input, fill fields, resolve errors iteratively.", styles["body"]))
    s.append(Paragraph("<b>AI:</b> extract intent, draft order, suggest rates/routes, flag uncertain fields.", styles["body"]))
    s.append(Paragraph("<b>KPI target:</b> 40% lower order creation time; 60% fewer validation errors.", styles["body"]))

    s.append(Paragraph("3.2 Dispatch Decision Support", styles["h2"]))
    s.append(Paragraph("<b>Manual:</b> pick driver based on partial context and urgency.", styles["body"]))
    s.append(Paragraph("<b>AI:</b> rank assignments using proximity, skills, availability, SLA reliability, ETA risk.", styles["body"]))
    s.append(Paragraph("<b>KPI target:</b> 25% faster assignment decisions; 15% fewer reassignments.", styles["body"]))

    s.append(Paragraph("3.3 Exception Intelligence", styles["h2"]))
    s.append(Paragraph("<b>Manual:</b> reactive monitoring and delayed escalation.", styles["body"]))
    s.append(Paragraph("<b>AI:</b> detect route anomalies early, propose actions, draft stakeholder communications.", styles["body"]))
    s.append(Paragraph("<b>KPI target:</b> 20% fewer SLA breaches; faster major incident escalation.", styles["body"]))

    s.append(Paragraph("3.4 POD Closure Assurance", styles["h2"]))
    s.append(Paragraph("<b>Manual:</b> quality checks after completion; disputes discovered later.", styles["body"]))
    s.append(Paragraph("<b>AI:</b> POD quality score + completion confidence + low-trust review routing.", styles["body"]))

    s.append(Paragraph("4. Yard (YMS) Detailed Blueprint", styles["h1"]))
    s.append(Paragraph("4.1 Appointment Readiness", styles["h2"]))
    s.append(Paragraph("Pre-arrival risk scoring for late/no-show/missing-docs and proactive mitigation suggestions.", styles["body"]))
    s.append(Paragraph("4.2 Gate Decisioning", styles["h2"]))
    s.append(Paragraph("OCR-assisted validation with allow/hold/escalate recommendations and rationale capture.", styles["body"]))
    s.append(Paragraph("4.3 Queue + Dock Optimization", styles["h2"]))
    s.append(Paragraph("Dynamic prioritization using SLA clocks, readiness, labor constraints, and detention exposure.", styles["body"]))
    s.append(Paragraph("4.4 Incident Correlation", styles["h2"]))
    s.append(Paragraph("Correlate gate/queue/dock/labor signals into one incident narrative and recovery plan.", styles["body"]))
    s.append(PageBreak())

    s.append(Paragraph("5. Parking (PMS) Detailed Blueprint", styles["h1"]))
    s.append(Paragraph("5.1 Entry and Slot Guidance", styles["h2"]))
    s.append(Paragraph("Occupancy forecasting and best-slot recommendations to reduce queue and circulation.", styles["body"]))
    s.append(Paragraph("5.2 Payment & Exit Assurance", styles["h2"]))
    s.append(Paragraph("Explainable payable breakdown + override anomaly detection + dispute assist.", styles["body"]))
    s.append(Paragraph("5.3 Supervisor Intelligence", styles["h2"]))
    s.append(Paragraph("Auto shift summary, revenue variance signals, and next-shift corrective action list.", styles["body"]))

    s.append(Paragraph("6. Cross-Engine Orchestration Scenarios", styles["h1"]))
    s.append(
        table(
            ["Scenario", "Current Manual Response", "AI-Orchestrated Response"],
            [
                [
                    "Fleet delay impacts yard slot",
                    "Dispatcher informs yard manually; queue adjusted late",
                    "ETA risk auto-propagates to YMS + slot/queue replan + customer update draft",
                ],
                [
                    "Yard congestion impacts delivery ETAs",
                    "Teams discover impact after SLA drift",
                    "Congestion forecast updates FleetOps ETA risk and proposes mitigation options",
                ],
                [
                    "PMS exit anomalies indicate leakage risk",
                    "Supervisor investigates from reports later",
                    "Real-time anomaly score + role-routed investigation tasks + trend monitoring",
                ],
            ],
            [4.0 * cm, 5.4 * cm, 6.5 * cm],
        )
    )
    s.append(PageBreak())

    s.append(Paragraph("7. Governance and Trust Model", styles["h1"]))
    for b in [
        "High confidence: one-click execution for low-risk actions.",
        "Medium confidence: recommendation with mandatory review.",
        "Low confidence: options only, no default action.",
        "Critical actions (dispatch lock, gate deny, policy override) require explicit human approval.",
        "All recommendations must log signals, model/rule version, confidence, actor, and outcome.",
    ]:
        s.append(Paragraph(f"• {b}", styles["bullet"]))

    s.append(Paragraph("8. KPI Framework", styles["h1"]))
    s.append(
        table(
            ["KPI Category", "Example Measures"],
            [
                ["Efficiency", "time-to-create-order, gate cycle time, queue-to-dock cycle time"],
                ["Reliability", "SLA breach rate, exception response time, reassignment rate"],
                ["Financial", "detention leakage prevented, revenue variance reduction, override anomalies"],
                ["Adoption", "recommendation acceptance rate, override reasons, user trust score"],
            ],
            [3.5 * cm, 12.4 * cm],
        )
    )

    s.append(Paragraph("9. Phased Rollout Plan", styles["h1"]))
    s.append(
        table(
            ["Phase", "Timeline", "Primary Deliverables"],
            [
                ["Phase 1", "0-6 weeks", "smart prefill, shift summaries, intelligent alerting, message drafts"],
                ["Phase 2", "6-12 weeks", "assignment/queue/dock recommendations, delay prediction, explainability panel"],
                ["Phase 3", "12-20 weeks", "cross-engine incident graph, guarded semi-automation, command center"],
            ],
            [2.2 * cm, 2.6 * cm, 11.1 * cm],
        )
    )

    s.append(Paragraph("10. Final Recommendation", styles["h1"]))
    s.append(
        Paragraph(
            "To outperform market-standard tools, Shipgen should prioritize AI in repetitive and decision-heavy workflows, "
            "with cross-engine coordination as the strategic core. The winning pattern is explainable recommendations, "
            "guarded approvals, and measurable operational impact in every release phase.",
            styles["body"],
        )
    )
    s.append(Spacer(1, 0.5 * cm))
    s.append(Paragraph(f"Generated {TODAY} · Detailed AI Automation Master Playbook v1.0 · Confidential", styles["small"]))
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
        title="AI Automation Master Playbook Detailed",
        author="Shipgen Engineering",
    )
    doc.build(story(styles), onFirstPage=footer, onLaterPages=footer)
    print(f"PDF written to: {OUTPUT}")


if __name__ == "__main__":
    main()

