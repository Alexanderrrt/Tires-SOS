from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\Sales\Downloads\tires-sos-ads-analytics-7-dias (2).pdf")
OUT = ROOT / "output" / "pdf" / "tires-sos-ads-analytics-consolidado.pdf"
TMP = ROOT / "tmp" / "pdfs" / "source-yelp-replacement"
LOGO = ROOT / "public" / "logo.jpg"
TMP.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)

BG = colors.HexColor("#F4EFE7")
PANEL = colors.HexColor("#FFFFFF")
INK = colors.HexColor("#171310")
MUTED = colors.HexColor("#756B61")
LINE = colors.HexColor("#D9C8B7")
ORANGE = colors.HexColor("#FB5A00")
GREEN = colors.HexColor("#3DB36B")
GRAY = colors.HexColor("#88919C")
SOFT = colors.HexColor("#ECE5DD")

font = "Helvetica"
bold = "Helvetica-Bold"
for path, name in [
    (Path("C:/Windows/Fonts/aptos.ttf"), "Aptos"),
    (Path("C:/Windows/Fonts/aptos-bold.ttf"), "Aptos-Bold"),
]:
    if path.exists():
        pdfmetrics.registerFont(TTFont(name, str(path)))
if "Aptos" in pdfmetrics.getRegisteredFontNames():
    font = "Aptos"
if "Aptos-Bold" in pdfmetrics.getRegisteredFontNames():
    bold = "Aptos-Bold"

W, H = landscape(letter)


def rounded(c, x, y, w, h, fill=PANEL, stroke=LINE, radius=5):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def fit_text(c, text, x, y, max_width, size=8, min_size=5.5, face=font):
    current = size
    while current > min_size and c.stringWidth(text, face, current) > max_width:
        current -= 0.25
    c.setFont(face, current)
    c.drawString(x, y, text)


def metric(c, x, y, w, h, value, label, accent):
    rounded(c, x, y, w, h)
    c.setFillColor(accent)
    c.rect(x, y, w, 4, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont(bold, 16)
    c.drawCentredString(x + w / 2, y + h * 0.58, value)
    c.setFillColor(MUTED)
    c.setFont(bold, 6.2)
    c.drawCentredString(x + w / 2, y + h * 0.24, label.upper())


def header(c, title, badge_top, badge_bottom):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.drawImage(str(LOGO), 18, H - 80, width=86, height=58, preserveAspectRatio=True, mask="auto")
    rounded(c, 115, H - 75, 555, 50)
    c.setFillColor(INK)
    c.setFont(bold, 17)
    c.drawCentredString(392, H - 58, title)
    c.setFillColor(ORANGE)
    c.rect(681, H - 75, 93, 50, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont(bold, 7.5)
    c.drawCentredString(727.5, H - 50, badge_top)
    c.setFont(bold, 6)
    c.drawCentredString(727.5, H - 64, badge_bottom)


def footer(c, left, page, total=5):
    c.setFillColor(MUTED)
    c.setFont(font, 6)
    c.drawString(18, 18, left)
    c.drawRightString(W - 18, 18, f"Página {page} de {total}")


def yelp_page(path):
    c = canvas.Canvas(str(path), pagesize=(W, H))
    header(c, "Panel de Rendimiento de Yelp Ads", "YELP", "ADS")

    rounded(c, 18, 238, 388, 265)
    c.setFillColor(INK)
    c.setFont(bold, 10)
    c.drawString(31, 478, "Embudo de Rendimiento")
    c.setStrokeColor(LINE)
    c.line(31, 466, 392, 466)

    stages = [
        ("Impresiones de anuncios", "22.1K", 1.00, ORANGE),
        ("Clics en anuncios", "127", 0.72, INK),
        ("Leads de anuncios", "80", 0.56, GREEN),
        ("Visitas a la página", "63", 0.46, GRAY),
    ]
    yy = 426
    for label, value, frac, color in stages:
        c.setFillColor(MUTED)
        c.setFont(font, 6)
        c.drawString(52, yy + 5, label)
        c.setFillColor(SOFT)
        c.rect(120, yy, 235, 14, fill=1, stroke=0)
        c.setFillColor(color)
        c.rect(120, yy, 235 * frac, 14, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont(bold, 6.5)
        c.drawRightString(375, yy + 4, value)
        yy -= 45

    c.setFillColor(INK)
    c.setFont(bold, 9)
    c.drawString(31, 271, "Contribución de Leads - Últimos 12 meses")
    items = [("Mensajes", 445), ("Rutas y mapas", 16), ("Llamadas", 11), ("Visitas web", 2), ("CTA", 2)]
    x0 = 31
    total_w = 350
    total = sum(v for _, v in items)
    for label, value in items:
        width = total_w * value / total
        c.setFillColor(ORANGE if label == "Mensajes" else GREEN if label in ("Rutas y mapas", "Llamadas") else GRAY)
        c.rect(x0, 252, max(width, 2), 10, fill=1, stroke=0)
        x0 += width
    c.setFillColor(MUTED)
    c.setFont(font, 6.2)
    c.drawString(31, 241, "445 mensajes  |  16 rutas/mapas  |  11 llamadas  |  2 visitas web  |  2 CTA")

    metric(c, 422, 417, 110, 86, "22.1K", "Impresiones", INK)
    metric(c, 542, 417, 110, 86, "127", "Clics", ORANGE)
    metric(c, 662, 417, 112, 86, "0.57%", "CTR estimado", ORANGE)
    metric(c, 422, 319, 110, 86, "$519.89", "Gasto", GREEN)
    metric(c, 542, 319, 110, 86, "80", "Leads", ORANGE)
    metric(c, 662, 319, 112, 86, "$6.67", "Costo por lead", GRAY)

    rounded(c, 422, 101, 352, 203)
    c.setFillColor(INK)
    c.setFont(bold, 10)
    c.drawString(436, 280, "Resumen de la Plataforma")
    c.setStrokeColor(LINE)
    c.line(436, 268, 760, 268)
    c.setFillColor(INK)
    c.rect(436, 232, 324, 24, fill=1, stroke=0)
    c.setFillColor(PANEL)
    c.setFont(bold, 6)
    c.drawString(442, 241, "Métrica")
    c.drawString(642, 241, "Valor")
    rows = [
        ("Gasto (1-26 jul)", "$519.89"),
        ("Impresiones (30 días)", "22.1K"),
        ("Clics en anuncios", "127"),
        ("Leads (30 días)", "80"),
        ("Costo por lead", "$6.67"),
    ]
    ry = 214
    for idx, (name, value) in enumerate(rows):
        if idx % 2:
            c.setFillColor(colors.HexColor("#FBF7F1"))
            c.rect(436, ry - 6, 324, 24, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont(font, 6.2)
        c.drawString(442, ry + 2, name)
        c.drawString(642, ry + 2, value)
        ry -= 25
    c.setFillColor(GREEN)
    c.setFont(bold, 6.4)
    c.drawString(436, 88, "Fuente conectada: Yelp for Business")
    footer(c, "Datos en vivo | Yelp: últimos 30 días", 3)
    c.save()


def summary_page(path):
    c = canvas.Canvas(str(path), pagesize=(W, H))
    header(c, "Resumen Ejecutivo de Anuncios TIRES SOS", "RESUMEN", "ADS")

    metric(c, 18, 402, 177, 86, "$2,638.48", "Gasto Meta + Google (7 días)", GREEN)
    metric(c, 208, 402, 177, 86, "86,463", "Impresiones Meta + Google", INK)
    metric(c, 398, 402, 177, 86, "2,764", "Clics Meta + Google", ORANGE)
    metric(c, 588, 402, 186, 86, "46", "Conversiones Meta + Google", GRAY)

    rounded(c, 18, 171, 375, 211)
    c.setFillColor(INK)
    c.setFont(bold, 10)
    c.drawString(31, 356, "Rendimiento por Plataforma")
    c.setStrokeColor(LINE)
    c.line(31, 344, 380, 344)
    platform_rows = [
        ("Google Ads - 7 días", "$134.91", "4,355 imp. | 149 clics | 26 conv.", INK),
        ("Meta Ads - 7 días", "$2,503.57", "82,108 imp. | 2,615 clics | 20 conv.", ORANGE),
        ("Yelp Ads - 30 días", "$519.89", "22.1K imp. | 127 clics | 80 leads", GREEN),
    ]
    yy = 307
    for name, spend, detail, color in platform_rows:
        c.setFillColor(INK)
        c.setFont(bold, 7)
        c.drawString(37, yy, name)
        c.drawRightString(371, yy, spend)
        c.setFillColor(color)
        c.rect(142, yy - 16, 209, 10, fill=1, stroke=0)
        c.setFillColor(MUTED)
        c.setFont(font, 6)
        c.drawString(37, yy - 15, detail)
        yy -= 58

    rounded(c, 408, 171, 366, 211)
    c.setFillColor(INK)
    c.setFont(bold, 10)
    c.drawString(422, 356, "Eficiencia")
    c.setStrokeColor(LINE)
    c.line(422, 344, 760, 344)
    c.setFillColor(INK)
    c.rect(422, 310, 338, 26, fill=1, stroke=0)
    c.setFillColor(PANEL)
    c.setFont(bold, 6)
    for x, text in [(428, "Plataforma"), (556, "CPC"), (630, "CTR"), (704, "Resultado")]:
        c.drawString(x, 320, text)
    eff = [
        ("Google Ads", "$0.91", "3.42%", "26 conv."),
        ("Meta Ads", "$0.96", "3.18%", "20 conv."),
        ("Yelp Ads", "$4.30", "0.57%*", "80 leads"),
    ]
    yy = 288
    for idx, row in enumerate(eff):
        if idx % 2:
            c.setFillColor(colors.HexColor("#FBF7F1"))
            c.rect(422, yy - 10, 338, 28, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont(font, 6.2)
        for x, text in zip((428, 556, 630, 704), row):
            c.drawString(x, yy, text)
        yy -= 34
    c.setFillColor(MUTED)
    c.setFont(font, 5.8)
    c.drawString(422, 186, "* CTR estimado: 127 clics / 22.1K impresiones.")

    rounded(c, 18, 39, 756, 112)
    c.setFillColor(INK)
    c.setFont(bold, 10)
    c.drawString(31, 126, "Notas")
    c.setStrokeColor(LINE)
    c.line(31, 114, 760, 114)
    notes = [
        "Meta y Google corresponden a los últimos 7 días del panel conectado.",
        "Yelp corresponde a los últimos 30 días; su inversión cubre del 1 al 26 de julio.",
        "Los periodos se mantienen separados y no se suman como si fueran equivalentes.",
    ]
    c.setFont(font, 6.6)
    c.setFillColor(INK)
    ny = 98
    for note in notes:
        c.drawString(31, ny, note)
        ny -= 17
    footer(c, "Vista multiplataforma | Periodos identificados por plataforma", 4)
    c.save()


def consolidated_page(path):
    c = canvas.Canvas(str(path), pagesize=(W, H))
    header(c, "Impacto Total de la Inversión Digital", "IMPACTO", "TOTAL")

    rounded(c, 18, 378, 756, 112, fill=INK, stroke=INK)
    c.setFillColor(PANEL)
    c.setFont(bold, 31)
    c.drawString(42, 426, "108.6K")
    c.setFont(bold, 10)
    c.drawString(42, 405, "IMPRESIONES PUBLICITARIAS DOCUMENTADAS")
    c.setFillColor(ORANGE)
    c.setFont(bold, 25)
    c.drawString(341, 429, "2,891")
    c.setFillColor(PANEL)
    c.setFont(bold, 9)
    c.drawString(341, 405, "CLICS HACIA EL NEGOCIO")
    c.setFillColor(GREEN)
    c.setFont(bold, 25)
    c.drawString(585, 429, "126")
    c.setFillColor(PANEL)
    c.setFont(bold, 9)
    c.drawString(585, 405, "RESULTADOS REPORTADOS")

    rounded(c, 18, 201, 478, 158)
    c.setFillColor(INK)
    c.setFont(bold, 11)
    c.drawString(34, 334, "Una inversión que generó visibilidad a escala")
    c.setFillColor(MUTED)
    c.setFont(font, 7.2)
    c.drawString(34, 316, "La pauta generó más de 108 mil oportunidades de exposición para TIRES SOS.")
    c.drawString(34, 303, "Además, PostHog registró aproximadamente 80K vistas/actividad del sitio.")
    c.setFillColor(SOFT)
    c.roundRect(34, 230, 446, 52, 4, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont(bold, 23)
    c.drawString(52, 248, "$29.09")
    c.setFillColor(INK)
    c.setFont(bold, 8)
    c.drawString(156, 258, "POR CADA 1,000 IMPRESIONES")
    c.setFont(font, 6.5)
    c.setFillColor(MUTED)
    c.drawString(156, 244, "Costo combinado de medios sobre impresiones reportadas")

    rounded(c, 512, 201, 262, 158)
    c.setFillColor(INK)
    c.setFont(bold, 10)
    c.drawString(528, 334, "Inversión frente a resultados")
    c.setStrokeColor(LINE)
    c.line(528, 320, 758, 320)
    comparison = [
        ("Inversión publicitaria", "$3,158.37"),
        ("Impresiones de anuncios", "108,563"),
        ("Clics reportados", "2,891"),
        ("Conv. + leads reportados", "126"),
    ]
    yy = 297
    for idx, (label, value) in enumerate(comparison):
        c.setFillColor(MUTED)
        c.setFont(font, 6.6)
        c.drawString(528, yy, label)
        c.setFillColor(GREEN if idx else INK)
        c.setFont(bold, 8)
        c.drawRightString(754, yy, value)
        yy -= 25

    rounded(c, 18, 58, 756, 124)
    c.setFillColor(INK)
    c.setFont(bold, 10)
    c.drawString(34, 157, "Lectura ejecutiva")
    c.setStrokeColor(LINE)
    c.line(34, 145, 758, 145)
    statements = [
        ("ALCANCE", "Meta fue el principal motor de visibilidad, con 82,108 impresiones en 7 días."),
        ("INTENCIÓN", "Google y Yelp aportaron acciones de mayor intención: conversiones, mensajes, rutas y llamadas."),
        ("VALIDACIÓN", "PostHog mostró ~80K vistas/actividad web, señal de atención digital más allá del clic."),
    ]
    yy = 125
    for label, text_value in statements:
        c.setFillColor(ORANGE)
        c.setFont(bold, 6.5)
        c.drawString(34, yy, label)
        c.setFillColor(INK)
        fit_text(c, text_value, 91, yy, 650, size=6.7)
        yy -= 25
    c.setFillColor(MUTED)
    c.setFont(font, 5.5)
    c.drawString(34, 68, "Periodos: Meta/Google 7 días; Yelp 30 días y gasto 1-26 jul.; PostHog según panel consultado.")
    footer(c, "Resumen consolidado | Las métricas no representan personas únicas", 5)
    c.save()


def page_number_overlay(path, page):
    source_w, source_h = 841.89, 595.28
    c = canvas.Canvas(str(path), pagesize=(source_w, source_h))
    c.setFillColor(BG)
    c.rect(source_w - 112, 5, 112, 24, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont(font, 6)
    c.drawRightString(source_w - 18, 18, f"Página {page} de 5")
    c.save()


yelp_pdf = TMP / "yelp-page.pdf"
summary_pdf = TMP / "summary-page.pdf"
consolidated_pdf = TMP / "consolidated-page.pdf"
page1_overlay_pdf = TMP / "page1-number.pdf"
page2_overlay_pdf = TMP / "page2-number.pdf"
yelp_page(yelp_pdf)
summary_page(summary_pdf)
consolidated_page(consolidated_pdf)
page_number_overlay(page1_overlay_pdf, 1)
page_number_overlay(page2_overlay_pdf, 2)

source = PdfReader(str(SOURCE))
yelp = PdfReader(str(yelp_pdf))
summary = PdfReader(str(summary_pdf))
consolidated = PdfReader(str(consolidated_pdf))
page1_overlay = PdfReader(str(page1_overlay_pdf))
page2_overlay = PdfReader(str(page2_overlay_pdf))
writer = PdfWriter()
source.pages[0].merge_page(page1_overlay.pages[0])
source.pages[1].merge_page(page2_overlay.pages[0])
writer.add_page(source.pages[0])
writer.add_page(source.pages[1])
writer.add_page(yelp.pages[0])
writer.add_page(summary.pages[0])
writer.add_page(consolidated.pages[0])
with OUT.open("wb") as stream:
    writer.write(stream)

print(OUT)
