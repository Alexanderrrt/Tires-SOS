from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "google-ads-budget-recommendation.pdf"
LOGO = ROOT / "public" / "logo-mark.png"

NAVY = colors.HexColor("#101820")
ORANGE = colors.HexColor("#F05A28")
CREAM = colors.HexColor("#FFF8F1")
LIGHT = colors.HexColor("#F2F4F6")
MID = colors.HexColor("#66717B")
GREEN = colors.HexColor("#16825D")


class NumberedDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal")
        self.addPageTemplates(PageTemplate(id="report", frames=[frame], onPage=self.draw_page))

    def draw_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, letter[1] - 0.22 * inch, letter[0], 0.22 * inch, fill=1, stroke=0)
        canvas.setStrokeColor(colors.HexColor("#D8DDE2"))
        canvas.line(doc.leftMargin, 0.48 * inch, letter[0] - doc.rightMargin, 0.48 * inch)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MID)
        canvas.drawString(doc.leftMargin, 0.30 * inch, "TIRES SOS Rescue | Google Ads recommendation review")
        canvas.drawRightString(letter[0] - doc.rightMargin, 0.30 * inch, f"Page {doc.page}")
        canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="Kicker", fontName="Helvetica-Bold", fontSize=9, leading=11,
    textColor=ORANGE, spaceAfter=7, tracking=1.2,
))
styles.add(ParagraphStyle(
    name="TitleCustom", fontName="Helvetica-Bold", fontSize=25, leading=29,
    textColor=NAVY, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="Subtitle", fontName="Helvetica", fontSize=11, leading=16,
    textColor=MID, spaceAfter=16,
))
styles.add(ParagraphStyle(
    name="Section", fontName="Helvetica-Bold", fontSize=14, leading=17,
    textColor=NAVY, spaceBefore=10, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="BodyCustom", fontName="Helvetica", fontSize=9.5, leading=14,
    textColor=NAVY, spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="Small", fontName="Helvetica", fontSize=7.8, leading=11,
    textColor=MID,
))
styles.add(ParagraphStyle(
    name="Metric", fontName="Helvetica-Bold", fontSize=17, leading=20,
    textColor=NAVY, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="MetricLabel", fontName="Helvetica", fontSize=7.5, leading=10,
    textColor=MID, alignment=TA_CENTER,
))


def p(text, style="BodyCustom"):
    return Paragraph(text, styles[style])


def metric(value, label, accent=NAVY):
    value_style = ParagraphStyle(
        f"Metric-{value}-{label}", parent=styles["Metric"], textColor=accent
    )
    return [Paragraph(value, value_style), Paragraph(label, styles["MetricLabel"])]


def metric_table(items):
    cells = [metric(*item) for item in items]
    table = Table([cells], colWidths=[1.62 * inch] * len(cells), rowHeights=[0.86 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D8DDE2")),
        ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#D8DDE2")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


def detail_table(rows, widths=(2.65 * inch, 3.85 * inch)):
    data = [[p(a, "Small"), p(b, "BodyCustom")] for a, b in rows]
    table = Table(data, colWidths=list(widths), hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D8DDE2")),
        ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#D8DDE2")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


OUT.parent.mkdir(parents=True, exist_ok=True)
doc = NumberedDocTemplate(
    str(OUT), pagesize=letter,
    leftMargin=0.72 * inch, rightMargin=0.72 * inch,
    topMargin=0.54 * inch, bottomMargin=0.66 * inch,
    title="Google Ads Budget Recommendation - Tires SOS Rescue",
    author="Tires SOS Rescue",
)

story = []
header = Table([
    [Image(str(LOGO), width=1.45 * inch, height=0.76 * inch),
     p("GOOGLE ADS RECOMMENDATION<br/><font size='8' color='#66717B'>Prepared August 12, 2026</font>", "Kicker")]
], colWidths=[1.65 * inch, 4.85 * inch])
header.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
story.extend([header, Spacer(1, 0.12 * inch)])
story.append(p("Budget Increase Proposal", "TitleCustom"))
story.append(p(
    "A presentation-ready summary of Google's current recommendation for the active Tires SOS Performance Max campaign. This document records the proposal only; no budget or bid changes were applied.",
    "Subtitle",
))

callout = Table([[p(
    "<b>Google recommends increasing the daily budget from $9.50 to $17.00.</b><br/>"
    "Google projects 47% more weekly conversions, with a 22% increase in weekly cost per acquisition.",
    "BodyCustom",
)]], colWidths=[6.5 * inch])
callout.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), CREAM),
    ("BOX", (0, 0), (-1, -1), 1.2, ORANGE),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
]))
story.extend([callout, Spacer(1, 0.16 * inch)])

story.append(metric_table([
    ("$9.50", "CURRENT DAILY BUDGET", NAVY),
    ("$17.00", "GOOGLE RECOMMENDED", ORANGE),
    ("+47%", "PROJECTED WEEKLY CONVERSIONS", GREEN),
    ("+22%", "PROJECTED WEEKLY CPA", ORANGE),
]))

story.append(p("Current campaign snapshot", "Section"))
story.append(detail_table([
    ("Campaign", "Tires SOS | PMax | Winner Scale | 2026-07-23"),
    ("Reporting window", "July 16 - August 11, 2026 (last 30 days shown in Google Ads)"),
    ("Status / strategy", "Enabled | Performance Max | Maximize conversions"),
    ("Performance", "23 conversions | 224 clicks | 5,777 impressions | 3.88% CTR"),
    ("Efficiency", "$151.15 spend | $6.57 cost per conversion | 9.66% conversion rate"),
    ("Optimization score", "89.3%; Google says applying this budget recommendation would add 10.7 percentage points"),
]))

story.append(p("Financial impact", "Section"))
story.append(metric_table([
    ("+$7.50", "ADDITIONAL DAILY CAPACITY", ORANGE),
    ("+$52.50", "ADDITIONAL WEEKLY CAPACITY", ORANGE),
    ("+$228", "APPROX. ADDITIONAL 30.4-DAY MONTH", ORANGE),
    ("+78.9%", "BUDGET INCREASE", ORANGE),
]))
story.append(Spacer(1, 0.10 * inch))
story.append(p(
    "Budgets are spending limits, not guaranteed spend. The projections are Google simulations and are not promises of future results. Actual performance can vary with demand, competition, conversion tracking, and auction conditions.",
    "Small",
))

story.append(p("Decision framework", "Section"))
decision = Table([
    [p("OPTION", "Small"), p("WHEN IT FITS", "Small"), p("CONTROL", "Small")],
    [p("Approve Google's recommendation"), p("When the business can accept a higher CPA in exchange for more lead volume."), p("Move to $17/day and review after 14 days.")],
    [p("Run a controlled test"), p("When management wants evidence before committing to the full increase."), p("Test $13/day for 14 days, then compare conversion volume and CPA.")],
    [p("Keep current budget"), p("When protecting efficiency and cash flow matters more than incremental volume."), p("Remain at $9.50/day; no account change required.")],
], colWidths=[1.65 * inch, 3.05 * inch, 1.8 * inch])
decision.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D8DDE2")),
    ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#D8DDE2")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#FAFBFC")),
]))
story.append(decision)
story.append(Spacer(1, 0.14 * inch))

recommendation_box = Table([[p(
    "<b>Recommended management approach:</b> Treat Google's $17/day figure as a growth proposal, not an automatic optimization. If added lead capacity can be handled operationally, approve a time-boxed test with a pre-set CPA review threshold. Otherwise, keep the current $9.50/day budget.",
    "BodyCustom",
)]], colWidths=[6.5 * inch])
recommendation_box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EAF5F0")),
    ("BOX", (0, 0), (-1, -1), 1, GREEN),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story.append(KeepTogether([recommendation_box, Spacer(1, 0.12 * inch), p(
    "Suggested test guardrails", "Section"
)]))
story.append(detail_table([
    ("Test length", "14 days after the budget change, with no additional bidding changes during the test."),
    ("Spend ceiling", "$17.00 per day for the active campaign; do not apply the recommendation to the paused campaign."),
    ("Efficiency checkpoint", "Review if cost per conversion materially exceeds about $8.02, the current $6.57 CPA plus Google's projected 22% increase."),
    ("Volume checkpoint", "Confirm the shop can answer and service the additional calls and lead forms generated by the campaign."),
]))
story.append(p("Management decision", "Section"))
approval = Table([
    [p("[ ] Approve $17/day", "BodyCustom"), p("[ ] Approve controlled $13/day test", "BodyCustom"), p("[ ] Keep $9.50/day", "BodyCustom")],
    [p("Decision owner: ____________________", "Small"), p("Date: ____________________", "Small"), p("Review date: ____________________", "Small")],
], colWidths=[2.15 * inch, 2.35 * inch, 2.0 * inch])
approval.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D8DDE2")),
    ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#D8DDE2")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story.extend([approval, Spacer(1, 0.14 * inch), p(
    "Source: Google Ads Recommendations and Campaigns views for the Tires SOS Rescue account, accessed August 12, 2026. Figures reflect Google's interface and simulation at the time of review. Budget recommendation was not applied.",
    "Small",
)])

doc.build(story)
print(OUT)
