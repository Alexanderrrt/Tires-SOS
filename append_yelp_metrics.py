from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parent
SOURCE = Path(r"C:\Users\Alexander\Downloads\BayTech_Experts_Google_Ads_Report_Tires_SOS_Rescue.pdf")
OUTPUT = ROOT / "output" / "pdf" / "BayTech_Experts_Google_Ads_Report_Tires_SOS_Rescue_with_Yelp_Metrics.pdf"
APPENDIX = ROOT / "tmp" / "pdfs" / "yelp_metrics_appendix.pdf"


NAVY = colors.HexColor("#102A43")
BLUE = colors.HexColor("#1976D2")
LIGHT_BLUE = colors.HexColor("#EAF3FB")
INK = colors.HexColor("#243B53")
MUTED = colors.HexColor("#627D98")
LINE = colors.HexColor("#D9E2EC")
GREEN = colors.HexColor("#17804A")


def draw_header(c, page_w, page_h):
    c.setFillColor(NAVY)
    c.rect(0, page_h - 0.58 * inch, page_w, 0.58 * inch, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.55 * inch, page_h - 0.36 * inch, "BAYTECH EXPERTS")
    c.setFont("Helvetica", 8)
    c.drawRightString(page_w - 0.55 * inch, page_h - 0.36 * inch, "DESIGN. DEVELOP. GROW.")


def draw_card(c, x, y, w, h, title, address, rating, metrics, ad_metrics, breakdown):
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
    c.setFillColor(BLUE)
    c.roundRect(x, y + h - 0.12 * inch, w, 0.12 * inch, 8, fill=1, stroke=0)
    c.rect(x, y + h - 0.12 * inch, w, 0.06 * inch, fill=1, stroke=0)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x + 0.22 * inch, y + h - 0.42 * inch, title)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(x + 0.22 * inch, y + h - 0.62 * inch, address)

    top = y + h - 0.94 * inch
    col_w = (w - 0.44 * inch) / 3
    for i, (label, value) in enumerate(metrics):
        xx = x + 0.22 * inch + i * col_w
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.5)
        c.drawString(xx, top, label.upper())
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(xx, top - 0.23 * inch, value)

    line_y = top - 0.48 * inch
    c.setStrokeColor(LINE)
    c.line(x + 0.22 * inch, line_y, x + w - 0.22 * inch, line_y)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(x + 0.22 * inch, line_y - 0.23 * inch, "YELP ADS ATTRIBUTION")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(x + 0.22 * inch, line_y - 0.43 * inch, ad_metrics)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(x + 0.22 * inch, line_y - 0.70 * inch, "LEAD BREAKDOWN")
    c.setFillColor(INK)
    c.setFont("Helvetica", 7.6)
    parts = breakdown.split(" | ")
    first_line = " | ".join(parts[:2])
    second_line = " | ".join(parts[2:])
    c.drawString(x + 0.22 * inch, line_y - 0.90 * inch, first_line)
    if second_line:
        c.drawString(x + 0.22 * inch, line_y - 1.08 * inch, second_line)


def make_appendix():
    APPENDIX.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(APPENDIX), pagesize=letter)
    page_w, page_h = letter
    draw_header(c, page_w, page_h)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(0.55 * inch, page_h - 1.05 * inch, "YELP PERFORMANCE METRICS")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9.5)
    c.drawString(0.55 * inch, page_h - 1.29 * inch, "Tires SOS Rescue locations | Yelp Business dashboard | Last 30 days")

    c.setFillColor(LIGHT_BLUE)
    c.roundRect(0.55 * inch, page_h - 1.83 * inch, page_w - 1.1 * inch, 0.34 * inch, 6, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(0.75 * inch, page_h - 1.62 * inch, "YELP SNAPSHOT")
    c.setFillColor(INK)
    c.setFont("Helvetica", 8.5)
    c.drawString(1.72 * inch, page_h - 1.62 * inch, "Metrics below are location-specific and reflect the dashboard's Last 30 days view.")

    card_w = (page_w - 1.32 * inch) / 2
    card_y = page_h - 5.45 * inch
    card_h = 3.25 * inch
    draw_card(
        c,
        0.55 * inch,
        card_y,
        card_w,
        card_h,
        "Tires SOS Rescue 2",
        "1407 N 10th St, San Jose, CA 95112",
        "Yelp rating: 2.0 / 5 (2 reviews)",
        [("Impressions", "1.8k"), ("Page visits", "26"), ("Leads", "176")],
        "912 impressions, 15 page visits, and 175 leads from Ads.",
        "Messages 175 | Website visits 1 | Directions & map views 0 | Other leads 0",
    )
    draw_card(
        c,
        0.77 * inch + card_w,
        card_y,
        card_w,
        card_h,
        "Tires SOS Rescue 3",
        "905 W A St, Hayward, CA 94541",
        None,
        [("Impressions", "1.2k"), ("Page visits", "17"), ("Leads", "147")],
        "900 impressions, 3 page visits, and 136 leads from Ads.",
        "Messages 140 | Website visits 7 | Directions & map views 0 | Calls 0",
    )

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.55 * inch, card_y - 0.50 * inch, "KEY TAKEAWAYS")
    c.setFillColor(INK)
    c.setFont("Helvetica", 9)
    bullets = [
        "Rescue 2: 1.8k impressions, 26 visits, 176 leads; 2.0/5 Yelp rating (2 reviews).",
        "Rescue 3 generated 147 leads, with 140 attributed to messages and 7 to website visits.",
        "Both locations show lead volume dominated by Yelp Ads attribution; treat these as platform-reported leads, not booked jobs or revenue.",
    ]
    yy = card_y - 0.78 * inch
    for bullet in bullets:
        c.setFillColor(BLUE)
        c.circle(0.67 * inch, yy + 0.03 * inch, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.drawString(0.80 * inch, yy, bullet)
        yy -= 0.24 * inch

    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 7.5)
    c.drawString(0.55 * inch, 0.62 * inch, "Source: Yelp for Business dashboard, accessed September 10, 2026. Reporting window: Last 30 days.")
    c.setFont("Helvetica", 8)
    c.drawRightString(page_w - 0.55 * inch, 0.38 * inch, "Prepared by BayTech Experts | BayTechExperts.com Page 4")
    c.save()


def merge():
    make_appendix()
    writer = PdfWriter()
    for page in PdfReader(str(SOURCE)).pages:
        writer.add_page(page)
    for page in PdfReader(str(APPENDIX)).pages:
        writer.add_page(page)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("wb") as f:
        writer.write(f)


if __name__ == "__main__":
    merge()
    print(OUTPUT)
