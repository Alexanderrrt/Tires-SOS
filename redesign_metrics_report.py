from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "output" / "pdf" / "Reporte_Metricas_Tires_SOS_Rescue_ES.pdf"

NAVY = colors.HexColor("#102A43")
BLUE = colors.HexColor("#1976D2")
AQUA = colors.HexColor("#27C2D8")
LIGHT = colors.HexColor("#EEF5FB")
INK = colors.HexColor("#243B53")
MUTED = colors.HexColor("#627D98")
LINE = colors.HexColor("#D9E2EC")
GREEN = colors.HexColor("#17804A")


def header(c, page_no):
    w, h = letter
    c.setFillColor(NAVY)
    c.rect(0, h - 0.68 * inch, w, 0.68 * inch, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.circle(0.72 * inch, h - 0.34 * inch, 0.16 * inch, fill=1, stroke=0)
    c.setFillColor(AQUA)
    c.roundRect(0.88 * inch, h - 0.50 * inch, 0.055 * inch, 0.32 * inch, 2, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(0.63 * inch, h - 0.39 * inch, "B")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(1.03 * inch, h - 0.33 * inch, "BAYTECH")
    c.setFont("Helvetica", 7.2)
    c.drawString(1.03 * inch, h - 0.48 * inch, "EXPERTS")
    c.setFont("Helvetica", 8)
    c.drawRightString(w - 0.55 * inch, h - 0.39 * inch, "MÉTRICAS DE RENDIMIENTO")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(0.55 * inch, 0.38 * inch, "Tires SOS Rescue | Últimos 30 días")
    c.drawRightString(w - 0.55 * inch, 0.38 * inch, f"Página {page_no}")


def title(c, text, subtitle=None):
    w, h = letter
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 21)
    c.drawString(0.55 * inch, h - 1.08 * inch, text)
    if subtitle:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9.5)
        c.drawString(0.55 * inch, h - 1.32 * inch, subtitle)


def card(c, x, y, w, h, label, value, accent=BLUE, sub=None):
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
    c.setFillColor(accent)
    c.roundRect(x, y + h - 0.10 * inch, w, 0.10 * inch, 8, fill=1, stroke=0)
    c.rect(x, y + h - 0.10 * inch, w, 0.05 * inch, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(x + 0.18 * inch, y + h - 0.32 * inch, label.upper())
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(x + 0.18 * inch, y + 0.16 * inch, value)
    if sub:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.5)
        c.drawRightString(x + w - 0.18 * inch, y + 0.18 * inch, sub)


def section(c, x, y, text):
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x, y, text.upper())
    c.setStrokeColor(BLUE)
    c.setLineWidth(2)
    c.line(x, y - 0.10 * inch, x + 0.48 * inch, y - 0.10 * inch)


def location_label(c, x, y, name, address):
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, name)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(x, y - 0.19 * inch, address)


def page1(c):
    header(c, 1)
    title(c, "TIRES SOS RESCUE", "Panel de métricas | Google Ads y Yelp")
    c.setFillColor(LIGHT)
    c.roundRect(0.55 * inch, 8.55 * inch - 0.42 * inch, 7.40 * inch, 0.42 * inch, 6, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(0.75 * inch, 8.30 * inch, "PERÍODO")
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(1.42 * inch, 8.30 * inch, "ÚLTIMOS 30 DÍAS")

    section(c, 0.55 * inch, 7.88 * inch, "Google Ads")
    labels = [
        ("Gasto publicitario", "$498"), ("Conversiones", "114"),
        ("Costo / conversión", "$4.37"), ("Clics", "765"),
        ("Impresiones", "19.8K"), ("CTR", "3.86%"),
        ("CPC promedio", "$0.65"), ("Tasa de conversión", "11%"),
    ]
    x0, y0, cw, ch, gap = 0.55 * inch, 5.40 * inch, 1.72 * inch, 0.82 * inch, 0.12 * inch
    for i, (lab, val) in enumerate(labels):
        x = x0 + (i % 4) * (cw + gap)
        y = y0 - (i // 4) * (ch + gap)
        card(c, x, y, cw, ch, lab, val)

    section(c, 0.55 * inch, 4.15 * inch, "Yelp")
    yelp = [
        ("Rescue 2 - Impresiones", "1.8K"), ("Rescue 2 - Visitas", "26"),
        ("Rescue 2 - Leads", "176"), ("Rescue 3 - Impresiones", "1.2K"),
        ("Rescue 3 - Visitas", "17"), ("Rescue 3 - Leads", "147"),
    ]
    x0, y0, cw, ch, gap = 0.55 * inch, 2.95 * inch, 2.34 * inch, 0.86 * inch, 0.14 * inch
    for i, (lab, val) in enumerate(yelp):
        x = x0 + (i % 3) * (cw + gap)
        y = y0 - (i // 3) * (ch + gap)
        card(c, x, y, cw, ch, lab, val, GREEN)
    c.showPage()


def page2(c):
    header(c, 2)
    title(c, "GOOGLE ADS", "Tires SOS Rescue | Últimos 30 días")
    section(c, 0.55 * inch, 7.18 * inch, "Métricas principales")
    labels = [
        ("Gasto publicitario", "$498"), ("Conversiones", "114"),
        ("Costo / conversión", "$4.37"), ("Clics", "765"),
        ("Impresiones", "19.8K"), ("CTR", "3.86%"),
        ("CPC promedio", "$0.65"), ("Tasa de conversión", "11%"),
    ]
    x0, y0, cw, ch, gap = 0.55 * inch, 5.00 * inch, 1.72 * inch, 0.90 * inch, 0.12 * inch
    for i, (lab, val) in enumerate(labels):
        x = x0 + (i % 4) * (cw + gap)
        y = y0 - (i // 4) * (ch + gap)
        card(c, x, y, cw, ch, lab, val)

    section(c, 0.55 * inch, 3.48 * inch, "Datos de cuenta")
    card(c, 0.55 * inch, 2.05 * inch, 2.30 * inch, 0.90 * inch, "Valor de conversión", "113", BLUE)
    card(c, 3.00 * inch, 2.05 * inch, 2.30 * inch, 0.90 * inch, "Valor / costo", "0.227", BLUE)
    card(c, 5.45 * inch, 2.05 * inch, 2.30 * inch, 0.90 * inch, "Período", "30 días", BLUE)
    c.showPage()


def mini_metric(c, x, y, w, label, value, accent=BLUE):
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.roundRect(x, y, w, 0.66 * inch, 6, fill=1, stroke=1)
    c.setFillColor(accent)
    c.roundRect(x, y + 0.56 * inch, w, 0.10 * inch, 6, fill=1, stroke=0)
    c.rect(x, y + 0.56 * inch, w, 0.05 * inch, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.9)
    c.drawString(x + 0.12 * inch, y + 0.35 * inch, label.upper())
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(x + 0.12 * inch, y + 0.12 * inch, value)


def page3(c):
    header(c, 3)
    title(c, "YELP", "Tires SOS Rescue | Últimos 30 días")
    locations = [
        {
            "name": "Tires SOS Rescue 2",
            "address": "1407 N 10th St, San Jose, CA 95112",
            "top": [("Impresiones", "1.8K"), ("Visitas de página", "26"), ("Leads", "176")],
            "ads": [("Impresiones de anuncios", "912"), ("Visitas de anuncios", "15"), ("Leads de anuncios", "175")],
            "breakdown": [("Mensajes", "175"), ("Visitas al sitio web", "1"), ("Direcciones / mapa", "0"), ("Calificación", "2.0"), ("Reseñas", "2")],
        },
        {
            "name": "Tires SOS Rescue 3",
            "address": "905 W A St, Hayward, CA 94541",
            "top": [("Impresiones", "1.2K"), ("Visitas de página", "17"), ("Leads", "147")],
            "ads": [("Impresiones de anuncios", "900"), ("Visitas de anuncios", "3"), ("Leads de anuncios", "136")],
            "breakdown": [("Mensajes", "140"), ("Visitas al sitio web", "7"), ("Direcciones / mapa", "0"), ("Llamadas", "0")],
        },
    ]
    for idx, loc in enumerate(locations):
        base_y = 6.80 * inch - idx * 3.25 * inch
        location_label(c, 0.55 * inch, base_y, loc["name"], loc["address"])
        x0, y0, cw, ch, gap = 0.55 * inch, base_y - 0.88 * inch, 2.34 * inch, 0.66 * inch, 0.14 * inch
        for i, (lab, val) in enumerate(loc["top"]):
            card(c, x0 + i * (cw + gap), y0, cw, ch, lab, val, GREEN)
        section(c, 0.55 * inch, y0 - 0.38 * inch, "Anuncios")
        ax, ay, aw = 0.55 * inch, y0 - 0.92 * inch, 2.34 * inch
        for i, (lab, val) in enumerate(loc["ads"]):
            mini_metric(c, ax + i * (aw + gap), ay, aw, lab, val, BLUE)
        section(c, 0.55 * inch, ay - 0.35 * inch, "Desglose")
        dx, dy = 0.55 * inch, ay - 0.88 * inch
        for i, (lab, val) in enumerate(loc["breakdown"]):
            mini_metric(c, dx + i * 1.42 * inch, dy, 1.30 * inch, lab, val, BLUE)
    c.showPage()


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=letter)
    page1(c)
    page2(c)
    page3(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
