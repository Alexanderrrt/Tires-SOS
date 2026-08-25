from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "Tires_SOS_Meta_Ads_Performance_and_Spend_Report.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#102A43")
BLUE = colors.HexColor("#1473E6")
CYAN = colors.HexColor("#1DB7D7")
GREEN = colors.HexColor("#0E9F6E")
AMBER = colors.HexColor("#E8A317")
RED = colors.HexColor("#C0392B")
INK = colors.HexColor("#243B53")
MUTED = colors.HexColor("#627D98")
PALE = colors.HexColor("#F2F7FB")
LINE = colors.HexColor("#D9E2EC")
WHITE = colors.white

font_regular = "Helvetica"
font_bold = "Helvetica-Bold"
for path, name in [
    (Path("C:/Windows/Fonts/aptos.ttf"), "Aptos"),
    (Path("C:/Windows/Fonts/aptos-bold.ttf"), "Aptos-Bold"),
]:
    if path.exists():
        pdfmetrics.registerFont(TTFont(name, str(path)))
if "Aptos" in pdfmetrics.getRegisteredFontNames():
    font_regular = "Aptos"
if "Aptos-Bold" in pdfmetrics.getRegisteredFontNames():
    font_bold = "Aptos-Bold"


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    "Eyebrow", fontName=font_bold, fontSize=9, leading=11,
    textColor=CYAN, spaceAfter=8, tracking=1.2,
))
styles.add(ParagraphStyle(
    "Hero", fontName=font_bold, fontSize=27, leading=31,
    textColor=NAVY, spaceAfter=10,
))
styles.add(ParagraphStyle(
    "Deck", fontName=font_regular, fontSize=12, leading=17,
    textColor=MUTED, spaceAfter=16,
))
styles.add(ParagraphStyle(
    "H2x", fontName=font_bold, fontSize=17, leading=21,
    textColor=NAVY, spaceBefore=8, spaceAfter=9,
))
styles.add(ParagraphStyle(
    "H3x", fontName=font_bold, fontSize=11, leading=14,
    textColor=NAVY, spaceAfter=4,
))
styles.add(ParagraphStyle(
    "Bodyx", fontName=font_regular, fontSize=9.5, leading=14,
    textColor=INK, spaceAfter=6,
))
styles.add(ParagraphStyle(
    "Smallx", fontName=font_regular, fontSize=7.5, leading=10,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    "Metric", fontName=font_bold, fontSize=21, leading=23,
    textColor=NAVY, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    "MetricLabel", fontName=font_regular, fontSize=8, leading=10,
    textColor=MUTED, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    "Callout", fontName=font_bold, fontSize=11, leading=15,
    textColor=WHITE,
))
styles.add(ParagraphStyle(
    "TableHeader", fontName=font_bold, fontSize=10, leading=13,
    textColor=WHITE,
))
styles.add(ParagraphStyle(
    "Quote", fontName=font_regular, fontSize=10, leading=15,
    textColor=WHITE,
))
styles.add(ParagraphStyle(
    "Bulletx", fontName=font_regular, fontSize=9.5, leading=14,
    leftIndent=12, firstLineIndent=-8, bulletIndent=0,
    textColor=INK, spaceAfter=5,
))


def p(text, style="Bodyx"):
    return Paragraph(text, styles[style])


def metric(value, label, accent=BLUE):
    cell = Table(
        [[p(value, "Metric")], [p(label, "MetricLabel")]],
        colWidths=[1.48 * inch],
        rowHeights=[0.42 * inch, 0.34 * inch],
    )
    cell.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("LINEABOVE", (0, 0), (-1, 0), 4, accent),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return cell


def section_header(title, kicker=None):
    parts = []
    if kicker:
        parts.append(p(kicker.upper(), "Eyebrow"))
    parts.append(p(title, "H2x"))
    parts.append(HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=10))
    return parts


def page_canvas(canvas, doc):
    canvas.saveState()
    w, h = letter
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 0.22 * inch, w, 0.22 * inch, fill=1, stroke=0)
    canvas.setFont(font_bold, 8)
    canvas.setFillColor(NAVY)
    canvas.drawString(0.58 * inch, 0.38 * inch, "TIRES SOS  |  META ADS REVIEW")
    canvas.setFont(font_regular, 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(w - 0.58 * inch, 0.38 * inch, f"CONFIDENTIAL  |  PAGE {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUT),
    pagesize=letter,
    rightMargin=0.58 * inch,
    leftMargin=0.58 * inch,
    topMargin=0.55 * inch,
    bottomMargin=0.62 * inch,
    title="Tires SOS Meta Ads Performance and Spend Review",
    author="Tires SOS",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="report", frames=frame, onPage=page_canvas)])

story = []

# Page 1
story += [
    Spacer(1, 0.12 * inch),
    p("META ADS PERFORMANCE REVIEW", "Eyebrow"),
    p("Strong customer demand.<br/>Controls corrected.", "Hero"),
    p(
        "The advertising generated measurable phone-call activity and broad local visibility. "
        "A duplicated campaign and permissive billing controls increased financial exposure; "
        "delivery has now been stopped while the account is stabilized.",
        "Deck",
    ),
]

story.append(Table(
    [[
        metric("18", "TRACKED CALLS", GREEN),
        metric("$5.88", "COST PER CALL", GREEN),
        metric("4,552", "PEOPLE REACHED", CYAN),
        metric("1.81x", "AVG. FREQUENCY", CYAN),
    ]],
    colWidths=[1.7 * inch] * 4,
    hAlign="CENTER",
    style=[("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4)],
))
story += [Spacer(1, 0.18 * inch)]

value_box = Table(
    [[p("BUSINESS VALUE CREATED", "Callout")],
     [p(
         "<b>18 high-intent phone calls</b> were attributed to the active lead campaign. "
         "At $5.88 per tracked call, the advertising demonstrated an efficient path to real customer conversations. "
         "The campaign reached 4,552 local prospects without excessive repetition.",
         "Bodyx",
     )]],
    colWidths=[doc.width],
)
value_box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), GREEN),
    ("BACKGROUND", (0, 1), (0, 1), colors.HexColor("#ECFDF5")),
    ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#A7F3D0")),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story += [value_box, Spacer(1, 0.17 * inch)]

story += section_header("Executive assessment", "What the owner should know")
assessment = [
    [p("What worked", "H3x"), p("What went wrong", "H3x"), p("What changed now", "H3x")],
    [
        p("The lead campaign produced calls at an efficient recorded cost and reached thousands of nearby prospects."),
        p("A duplicate campaign ran alongside the original. Billing thresholds and a manually reset account limit allowed charges to accumulate."),
        p("All delivery is paused. No campaign currently shows as active, preventing additional ad delivery while controls are reviewed."),
    ],
]
t = Table(assessment, colWidths=[doc.width / 3] * 3)
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), PALE),
    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story.append(t)
story += [
    Spacer(1, 0.12 * inch),
    p(
        "<b>Bottom line:</b> the advertising itself showed useful demand-generation performance. "
        "The failure was budget governance, not an absence of customer response.",
        "Bodyx",
    ),
    PageBreak(),
]

# Page 2
story += [p("FINANCIAL REVIEW", "Eyebrow"), p("Where the money went", "Hero")]
story += [p(
    "Payments processed on July 27 reflect delivered advertising and multiple billing events. "
    "Payment date is not the same as ad-delivery date.",
    "Deck",
)]
story.append(Table(
    [[
        metric("$1,553.50", "11 SUCCESSFUL PAYMENTS", RED),
        metric("$209.83", "CURRENT BALANCE", AMBER),
        metric("$1,763.33", "TOTAL EXPOSURE", RED),
        metric("$150", "FAILED - NOT COUNTED", MUTED),
    ]],
    colWidths=[1.7 * inch] * 4,
    hAlign="CENTER",
    style=[("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4)],
))
story += [Spacer(1, 0.17 * inch)]

story += section_header("Confirmed transaction evidence", "Traceable in Meta billing")
data = [
    [p("Billing event", "TableHeader"), p("What Meta recorded", "TableHeader"), p("Business interpretation", "TableHeader")],
    [
        p("$250.00 threshold payment"),
        p("July 20-27 delivery: $105.75 original campaign + $144.25 duplicate campaign."),
        p("Real ad delivery split across two nearly identical campaigns."),
    ],
    [
        p("$269.50 manual payment"),
        p("Duplicate campaign delivery from July 25-27; Meta recorded 8,247 impressions."),
        p("A manual payment cleared spend generated by the duplicate campaign."),
    ],
    [
        p("Repeated $110 payments"),
        p("Current Meta billing threshold is $110."),
        p("These appear to be threshold collections of accrued spend, not identical duplicate card charges."),
    ],
]
tbl = Table(data, colWidths=[1.25 * inch, 2.55 * inch, 2.95 * inch], repeatRows=1)
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [tbl, Spacer(1, 0.15 * inch)]

story += section_header("Root cause", "Control failure - not performance failure")
for item in [
    "<b>Duplicate delivery:</b> “Tires SOS | Leads | Jul 2026 - Copy” ran alongside the original campaign.",
    "<b>Weak financial guardrail:</b> Meta displayed a daily ceiling of $2,164.30, far above the intended operating level.",
    "<b>Account cap reset:</b> the $600 account spending limit displayed $0 spent and “reset manually,” indicating the safeguard had been restarted.",
    "<b>Billing compression:</b> multiple payments were processed on one day for advertising delivered over earlier dates.",
]:
    story.append(Paragraph(item, styles["Bulletx"], bulletText="•"))

story += [Spacer(1, 0.1 * inch)]
note = Table([[p(
    "<b>Dispute outlook:</b> Delivered impressions are normally valid charges. A dispute is strongest only if the duplicate campaign, "
    "manual payment, or spending-limit reset was unauthorized. No dispute has been submitted.",
    "Bodyx",
)]], colWidths=[doc.width])
note.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF8E6")),
    ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#F4C95D")),
    ("LEFTPADDING", (0, 0), (-1, -1), 13),
    ("RIGHTPADDING", (0, 0), (-1, -1), 13),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story.append(note)
story.append(PageBreak())

# Page 3
story += [p("RECOVERY PLAN", "Eyebrow"), p("Keep the demand.<br/>Fix the controls.", "Hero")]
story += [p(
    "The recommended response preserves what was working while making future spend predictable, reviewable, and owner-approved.",
    "Deck",
)]

steps = [
    ("1", "Containment complete", "All campaign delivery was paused and verified. No active campaign switches remained."),
    ("2", "Owner-approved restart", "Resume only one lead campaign after agreeing on a written daily and monthly ceiling."),
    ("3", "Hard account limit", "Set a conservative account spending limit that cannot be reset without owner approval."),
    ("4", "Daily alerts", "Create alerts at 50%, 75%, and 90% of the approved monthly budget."),
    ("5", "Weekly scorecard", "Report spend, calls, booked appointments, revenue, and estimated return every week."),
]
step_rows = []
for n, title, body in steps:
    badge = Table([[p(n, "Callout")]], colWidths=[0.34 * inch], rowHeights=[0.34 * inch])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BLUE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    step_rows.append([badge, [p(title, "H3x"), p(body, "Bodyx")]])
steps_table = Table(step_rows, colWidths=[0.48 * inch, doc.width - 0.48 * inch])
steps_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (1, 0), (1, -2), 0.5, LINE),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
]))
story.append(steps_table)
story += [Spacer(1, 0.15 * inch)]

story += section_header("Recommended owner message", "Direct, accountable, constructive")
owner_message = Table(
    [[p(
        "“The campaign proved there is real local demand: it generated 18 tracked calls at $5.88 per call. "
        "The problem was not customer response - it was that a duplicate campaign and weak account controls allowed spending to exceed the intended level. "
        "I paused all delivery, traced the billing, and prepared a control plan so any restart happens with one campaign, a hard spending cap, and weekly ROI reporting.”",
        "Quote",
    )]],
    colWidths=[doc.width],
)
owner_message.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
    ("BOX", (0, 0), (-1, -1), 0, NAVY),
    ("LEFTPADDING", (0, 0), (-1, -1), 16),
    ("RIGHTPADDING", (0, 0), (-1, -1), 16),
    ("TOPPADDING", (0, 0), (-1, -1), 14),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
]))
story.append(owner_message)
story += [
    Spacer(1, 0.17 * inch),
    p("Data note", "H3x"),
    p(
        "Prepared from Meta Ads Manager and Meta Billing activity reviewed July 27, 2026. "
        "The report separates payment timing from delivery timing. Revenue and appointment-close data were not available, "
        "so no unsupported revenue or ROI claim is included.",
        "Smallx",
    ),
]

doc.build(story)
print(OUT)
