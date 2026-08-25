from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "tires-sos-informe-ejecutivo-1-6-agosto-2026.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

BG = colors.HexColor("#080A0D")
CARD = colors.HexColor("#14181D")
CARD_2 = colors.HexColor("#1A2027")
ORANGE = colors.HexColor("#FF5A1F")
WHITE = colors.HexColor("#F7F8FA")
MUTED = colors.HexColor("#AEB6C1")
LINE = colors.HexColor("#303842")
GREEN = colors.HexColor("#4ADE80")
RED = colors.HexColor("#FF8066")
YELLOW = colors.HexColor("#F9C74F")

font_dir = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Inter", str(font_dir / "arial.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Bold", str(font_dir / "arialbd.ttf")))
PAGE_W, PAGE_H = letter


def page_frame(canvas: Canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(0.62 * inch, 0.48 * inch, PAGE_W - 0.62 * inch, 0.48 * inch)
    canvas.setFont("Inter", 7.4)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.62 * inch, 0.28 * inch, "TIRES SOS  /  INFORME EJECUTIVO SEMANAL")
    canvas.drawRightString(PAGE_W - 0.62 * inch, 0.28 * inch, f"1-6 AGO 2026   |   {doc.page} DE 2")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Kicker", fontName="Inter-Bold", fontSize=8, leading=10, textColor=ORANGE, tracking=1.2, spaceAfter=6))
styles.add(ParagraphStyle(name="TitleX", fontName="Inter-Bold", fontSize=27, leading=29, textColor=WHITE, spaceAfter=8))
styles.add(ParagraphStyle(name="Deck", fontName="Inter", fontSize=10, leading=14, textColor=MUTED))
styles.add(ParagraphStyle(name="H1", fontName="Inter-Bold", fontSize=16, leading=19, textColor=WHITE, spaceAfter=8))
styles.add(ParagraphStyle(name="H2", fontName="Inter-Bold", fontSize=10, leading=12, textColor=WHITE, spaceAfter=4))
styles.add(ParagraphStyle(name="Body", fontName="Inter", fontSize=8.7, leading=12.2, textColor=MUTED))
styles.add(ParagraphStyle(name="BodyWhite", fontName="Inter", fontSize=9, leading=12.5, textColor=WHITE))
styles.add(ParagraphStyle(name="Small", fontName="Inter", fontSize=7.1, leading=9.3, textColor=MUTED))
styles.add(ParagraphStyle(name="Metric", fontName="Inter-Bold", fontSize=22, leading=24, textColor=WHITE, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="MetricLabel", fontName="Inter-Bold", fontSize=7, leading=8.5, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="Status", fontName="Inter-Bold", fontSize=8, leading=10, textColor=WHITE, alignment=TA_CENTER))


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def metric_cards(items):
    cards = []
    for label, value, accent in items:
        card = Table([[p(value, "Metric")], [p(label.upper(), "MetricLabel")]], colWidths=[1.54 * inch], rowHeights=[0.38 * inch, 0.25 * inch])
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CARD), ("BOX", (0, 0), (-1, -1), 1, accent),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        cards.append(card)
    return Table([cards], colWidths=[1.70 * inch] * 4, hAlign="LEFT")


def concern(title, evidence, meaning, accent):
    number = Table([[p(title.split(" ", 1)[0], "Status")]], colWidths=[0.34 * inch], rowHeights=[0.34 * inch])
    number.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), accent), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    body = [p(title.split(" ", 1)[1], "H2"), p(f"<b>Evidencia:</b> {evidence}", "Body"), p(f"<b>Por qué importa:</b> {meaning}", "Body")]
    box = Table([[number, body]], colWidths=[0.52 * inch, 6.15 * inch])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD), ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return box


def action_row(priority, action, owner_result):
    return [p(priority, "Status"), p(action, "BodyWhite"), p(owner_result, "Body")]


story = []
logo = ROOT / "public" / "logo-mark.png"
if logo.exists():
    story.append(Image(str(logo), width=1.22 * inch, height=0.64 * inch))
story += [
    Spacer(1, 5), p("RESUMEN PARA EL PROPIETARIO", "Kicker"), p("Rendimiento del sitio web", "TitleX"),
    p("1-6 de agosto de 2026  |  Las cifras que impactan demanda, clientes potenciales y experiencia.", "Deck"),
    Spacer(1, 15), metric_cards([
        ("Visitantes únicos", "108", ORANGE), ("Sesiones", "115", ORANGE),
        ("Mensajes enviados", "13", GREEN), ("Leads registrados", "0", RED),
    ]), Spacer(1, 15),
]

headline = Table([[p("LECTURA EJECUTIVA", "Kicker")], [p("El sitio sí genera interés: 13 mensajes de 108 visitantes. La preocupación principal es que ninguna cita o cotización por WhatsApp quedó registrada como lead.", "BodyWhite")]], colWidths=[6.80 * inch])
headline.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), CARD_2), ("LINEBEFORE", (0, 0), (0, -1), 4, ORANGE),
    ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
]))
story += [headline, Spacer(1, 16), p("Lo que requiere atención", "H1")]
story += [
    concern("1 LOS LEADS NO APARECEN", "Se registraron 18 clics de contacto, 20 aperturas del chat y 13 mensajes; sin embargo, citas y cotizaciones por WhatsApp aparecen en cero.", "El paso final puede estar fallando, ser difícil de completar o medirse incorrectamente. Sin verificarlo, no se puede evaluar el retorno de la publicidad.", RED),
    Spacer(1, 8),
    concern("2 EL CLIENTE ES MÓVIL", "El 88% de la actividad medida provino de teléfonos. Mobile Safari y Facebook Mobile sumaron 58.7% de la actividad por navegador.", "Cualquier fricción móvil afecta a casi toda la clientela. Cotización, chat, llamada y cita deben probarse primero en teléfonos reales.", ORANGE),
    Spacer(1, 8),
    concern("3 PUBLICIDAD SIN MEDICIÓN", "111 sesiones aparecen como Paid Unknown y no existen etiquetas UTM de campaña.", "No se puede saber qué anuncio, plataforma o creativo produjo visitas útiles o leads. Así, las decisiones de presupuesto son una suposición.", YELLOW),
    Spacer(1, 14),
]

signal_data = [
    [p("Comportamiento", "H2"), p("157 páginas vistas / 115 sesiones = 1.37 páginas por sesión", "Body"), p("INTERACCIÓN BAJA", "Status")],
    [p("Contacto", "H2"), p("13 mensajes de 108 visitantes únicos = 12%", "Body"), p("HAY INTERÉS", "Status")],
]
signals = Table(signal_data, colWidths=[1.55 * inch, 3.65 * inch, 1.60 * inch], rowHeights=[0.46 * inch] * 2)
signals.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), CARD), ("GRID", (0, 0), (-1, -1), 0.6, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TEXTCOLOR", (2, 0), (2, -1), ORANGE),
]))
story += [p("Indicadores rápidos", "H1"), signals, PageBreak()]

story += [p("PRÓXIMOS 7 DÍAS", "Kicker"), p("Tres acciones que importan", "TitleX"), p("Primero confirme que el recorrido hasta el lead funciona. Después decida si conviene aumentar el tráfico.", "Deck"), Spacer(1, 16)]

actions = Table([
    [p("N.º", "Status"), p("ACCIÓN", "Status"), p("RESULTADO ESPERADO", "Status")],
    action_row("01", "Enviar un lead de prueba por chat, cita, teléfono y WhatsApp desde iPhone y Android. Confirmar el mensaje de éxito y el evento en PostHog.", "Ruta visita-a-lead comprobada."),
    action_row("02", "Revisar al menos 10 grabaciones con rage clicks y corregir el elemento móvil que repite la frustración.", "Problema identificado, responsable y fecha."),
    action_row("03", "Agregar fuente, medio, campaña y anuncio/creativo a cada enlace de publicidad pagada.", "Leads semanales por campaña."),
], colWidths=[0.86 * inch, 3.81 * inch, 2.13 * inch], rowHeights=[0.36 * inch, 1.02 * inch, 0.92 * inch, 0.92 * inch])
actions.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), ORANGE), ("BACKGROUND", (0, 1), (-1, -1), CARD),
    ("GRID", (0, 0), (-1, -1), 0.7, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("TEXTCOLOR", (0, 1), (0, -1), ORANGE),
]))
story += [actions, Spacer(1, 17), p("Tablero del propietario", "H1")]

scorecard = Table([
    [p("MÉTRICA", "Status"), p("ESTA SEMANA", "Status"), p("PRÓXIMA REVISIÓN", "Status")],
    [p("Visitantes únicos", "BodyWhite"), p("108", "BodyWhite"), p("Tendencia vs. semana anterior", "Body")],
    [p("Mensajes enviados", "BodyWhite"), p("13", "BodyWhite"), p("Resultado mensaje-a-lead", "Body")],
    [p("Citas + cotizaciones WhatsApp", "BodyWhite"), p("0 registrados", "BodyWhite"), p("Validar de principio a fin", "Body")],
    [p("Tasa de rage clicks", "BodyWhite"), p("7.0%", "BodyWhite"), p("Debe bajar tras corregir móvil", "Body")],
    [p("Campañas pagadas medibles", "BodyWhite"), p("No disponible", "BodyWhite"), p("Campañas y leads identificados", "Body")],
], colWidths=[2.65 * inch, 1.30 * inch, 2.85 * inch], rowHeights=[0.36 * inch] + [0.48 * inch] * 5)
scorecard.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), CARD_2), ("BACKGROUND", (0, 1), (-1, -1), CARD),
    ("GRID", (0, 0), (-1, -1), 0.7, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
]))
story += [scorecard, Spacer(1, 17)]

note = Table([[p("NOTA SOBRE LOS DATOS", "Kicker")], [p("PostHog no registró citas ni cotizaciones por WhatsApp completadas. Esto no demuestra que el negocio recibió cero leads; significa que ninguno apareció en esos dos eventos de conversión. Tampoco se puede atribuir rendimiento por campaña hasta implementar etiquetas UTM.", "Body")]], colWidths=[6.80 * inch])
note.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), CARD_2), ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story += [note, Spacer(1, 10), p("Fuente: proyecto PostHog 513826. Periodo: 1-6 de agosto de 2026. No se estimaron valores faltantes.", "Small")]

doc = SimpleDocTemplate(
    str(OUT), pagesize=letter, rightMargin=0.62 * inch, leftMargin=0.62 * inch,
    topMargin=0.55 * inch, bottomMargin=0.64 * inch,
    title="Tires SOS - Informe ejecutivo semanal - 1-6 agosto 2026", author="Tires SOS",
)
doc.build(story, onFirstPage=page_frame, onLaterPages=page_frame)
print(OUT)
