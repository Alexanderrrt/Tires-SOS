from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, Image, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "Tires_SOS_Reporte_Multicanal_Meta_Google_Yelp_FINAL.pdf"
LOGO = ROOT / "public" / "logo.jpg"
OUT.parent.mkdir(parents=True, exist_ok=True)

BLACK = colors.HexColor("#050505")
PANEL = colors.HexColor("#111111")
PANEL_2 = colors.HexColor("#171717")
ORANGE = colors.HexColor("#FF5A00")
ORANGE_DARK = colors.HexColor("#CF3F00")
WHITE = colors.HexColor("#F5F5F5")
SILVER = colors.HexColor("#B7B7B7")
LINE = colors.HexColor("#3B3B3B")
GREEN = colors.HexColor("#43E88A")
YELLOW = colors.HexColor("#FFD800")
RED = colors.HexColor("#F85149")

regular, bold = "Helvetica", "Helvetica-Bold"
for path, name in [
    (Path("C:/Windows/Fonts/aptos.ttf"), "Aptos"),
    (Path("C:/Windows/Fonts/aptos-bold.ttf"), "Aptos-Bold"),
]:
    if path.exists():
        pdfmetrics.registerFont(TTFont(name, str(path)))
if "Aptos" in pdfmetrics.getRegisteredFontNames():
    regular = "Aptos"
if "Aptos-Bold" in pdfmetrics.getRegisteredFontNames():
    bold = "Aptos-Bold"

s = getSampleStyleSheet()
s.add(ParagraphStyle("Eyebrow", fontName=bold, fontSize=9, leading=11, textColor=ORANGE,
                     tracking=1.2, spaceAfter=8))
s.add(ParagraphStyle("Hero", fontName=bold, fontSize=26, leading=29, textColor=WHITE,
                     spaceAfter=10))
s.add(ParagraphStyle("Deck", fontName=regular, fontSize=11.5, leading=16, textColor=SILVER,
                     spaceAfter=15))
s.add(ParagraphStyle("H2", fontName=bold, fontSize=17, leading=20, textColor=WHITE,
                     spaceBefore=6, spaceAfter=8))
s.add(ParagraphStyle("H3", fontName=bold, fontSize=10.5, leading=13, textColor=WHITE,
                     spaceAfter=4))
s.add(ParagraphStyle("Body", fontName=regular, fontSize=9.4, leading=13.5, textColor=WHITE,
                     spaceAfter=5))
s.add(ParagraphStyle("Muted", fontName=regular, fontSize=8, leading=11, textColor=SILVER))
s.add(ParagraphStyle("Metric", fontName=bold, fontSize=20, leading=22, textColor=WHITE,
                     alignment=TA_CENTER))
s.add(ParagraphStyle("MetricLabel", fontName=regular, fontSize=7.6, leading=9,
                     textColor=SILVER, alignment=TA_CENTER))
s.add(ParagraphStyle("Header", fontName=bold, fontSize=9.5, leading=12, textColor=WHITE))
s.add(ParagraphStyle("Quote", fontName=regular, fontSize=10, leading=14.5, textColor=WHITE))
s.add(ParagraphStyle("BulletES", fontName=regular, fontSize=9.3, leading=13.5,
                     textColor=WHITE, leftIndent=12, firstLineIndent=-8, spaceAfter=4))


def p(text, style="Body"):
    return Paragraph(text, s[style])


def metric(value, label, color=ORANGE):
    t = Table([[p(value, "Metric")], [p(label, "MetricLabel")]],
              colWidths=[1.46 * inch], rowHeights=[0.40 * inch, 0.34 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL_2),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("LINEABOVE", (0, 0), (-1, 0), 4, color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def section(title, kicker):
    return [
        p(kicker.upper(), "Eyebrow"),
        p(title, "H2"),
        HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=9),
    ]


def paint_page(canvas, doc):
    canvas.saveState()
    w, h = letter
    canvas.setFillColor(BLACK)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(ORANGE)
    canvas.rect(0, h - 0.16 * inch, w, 0.16 * inch, fill=1, stroke=0)
    canvas.rect(0, 0, w, 0.08 * inch, fill=1, stroke=0)
    canvas.setFont(bold, 8)
    canvas.setFillColor(WHITE)
    canvas.drawString(0.58 * inch, 0.34 * inch, "TIRES SOS  |  REVISIÓN DE META ADS")
    canvas.setFont(regular, 8)
    canvas.setFillColor(SILVER)
    canvas.drawRightString(w - 0.58 * inch, 0.34 * inch, f"CONFIDENCIAL  |  PAGINA {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUT), pagesize=letter,
    leftMargin=0.58 * inch, rightMargin=0.58 * inch,
    topMargin=0.38 * inch, bottomMargin=0.58 * inch,
    title="Informe de rendimiento y gasto de Meta Ads - Tires SOS",
    author="Tires SOS",
)
doc.addPageTemplates([PageTemplate(
    id="brand", frames=Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main"),
    onPage=paint_page,
)])

story = []

# Pagina 1
logo = Image(str(LOGO), width=1.78 * inch, height=1.18 * inch)
header = Table(
    [[logo, [p("RESULTADOS DE META ADS", "Eyebrow"),
             p("80,957 oportunidades<br/>de ser vistos.", "Hero")]]],
    colWidths=[1.98 * inch, doc.width - 1.98 * inch],
)
header.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BACKGROUND", (0, 0), (-1, -1), BLACK),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
]))
story += [header, Spacer(1, 0.05 * inch)]
story += [p(
    "En solo ocho días, Tires SOS logró una presencia digital masiva en el mercado local, generó miles "
    "de interacciones con la marca y produjo llamadas medibles de clientes potenciales.",
    "Deck",
)]
story.append(Table(
    [[metric("80,957", "IMPRESIONES TOTALES", ORANGE),
      metric("1,184", "CLICS EN ENLACES", GREEN),
      metric("2,475", "INTERACCIONES TOTALES", GREEN),
      metric("18", "LLAMADAS CONFIRMADAS", GREEN)]],
    colWidths=[1.7 * inch] * 4,
    style=[("VALIGN", (0, 0), (-1, -1), "TOP"),
           ("LEFTPADDING", (0, 0), (-1, -1), 4),
           ("RIGHTPADDING", (0, 0), (-1, -1), 4)],
))
story += [Spacer(1, 0.16 * inch)]

value = Table(
    [[p("VALOR GENERADO PARA EL NEGOCIO", "Header")],
     [p("<b>80,957 impresiones totales</b> colocaron a Tires SOS frente a una audiencia local a gran escala. "
        "Los anuncios generaron 1,184 clics directos en enlaces, 2,475 interacciones totales y 18 llamadas confirmadas. "
        "Cada impresión costó aproximadamente tres centavos.")]],
    colWidths=[doc.width],
)
value.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), ORANGE_DARK),
    ("BACKGROUND", (0, 1), (-1, 1), PANEL_2),
    ("BOX", (0, 0), (-1, -1), 0.8, ORANGE),
    ("LEFTPADDING", (0, 0), (-1, -1), 13),
    ("RIGHTPADDING", (0, 0), (-1, -1), 13),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story += [value, Spacer(1, 0.15 * inch)]
story += section("Resumen ejecutivo", "Una campaña de alta visibilidad")

summary = [
    [p("Visibilidad masiva", "Header"), p("Interés del mercado", "Header"), p("Siguiente etapa", "Header")],
    [p("Más de 80 mil apariciones de marca en pantallas de clientes potenciales de la zona."),
     p("1,184 clics en enlaces, 2,475 interacciones totales y 18 llamadas muestran intención real."),
     p("La entrega está pausada para analizar conversiones y relanzar con límites y objetivos más precisos.")],
]
t = Table(summary, colWidths=[doc.width / 3] * 3)
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), ORANGE_DARK),
    ("BACKGROUND", (0, 1), (-1, 1), PANEL_2),
    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [t, Spacer(1, 0.1 * inch)]
story += [p("<b>Conclusión:</b> la inversión aceleró fuertemente el reconocimiento local de Tires SOS. "
            "El siguiente paso es convertir ese volumen de atención en citas, ventas y clientes recurrentes.")]
story.append(PageBreak())

# Pagina 2
story += [p("EFICIENCIA DE LA INVERSIÓN", "Eyebrow"), p("Visibilidad a escala local", "Hero")]
story += [p(
    "La inversión se concentró en una ventana corta y produjo un volumen considerable de exposición e interacción. "
    "Los pagos se procesaron en varios eventos, pero corresponden a publicidad efectivamente entregada.",
    "Deck",
)]
story.append(Table(
    [[metric("$2,455.51", "INVERSIÓN PUBLICITARIA", YELLOW),
      metric("$30.33", "POR 1,000 IMPRESIONES", GREEN),
      metric("$0.03", "POR IMPRESIÓN", GREEN),
      metric("1.46%", "CTR DE ENLACES", GREEN)]],
    colWidths=[1.7 * inch] * 4,
    style=[("VALIGN", (0, 0), (-1, -1), "TOP"),
           ("LEFTPADDING", (0, 0), (-1, -1), 4),
           ("RIGHTPADDING", (0, 0), (-1, -1), 4)],
))
story += [Spacer(1, 0.15 * inch)]
story += section("Resultados confirmados por campaña", "Datos rastreables en Meta")

rows = [
    [p("Campaña / evento", "Header"), p("Resultado registrado", "Header"), p("Lectura de negocio", "Header")],
    [p("Campaña original"),
     p("$105.75 de gasto y 8,230 impresiones del 20 al 27 de julio."),
     p("Generó 18 llamadas registradas a $5.88 por llamada.")],
    [p("Campaña duplicada"),
     p("$2,349.76 de gasto y 72,727 impresiones del 20 al 27 de julio."),
     p("Produjo la mayor parte de la exposición y amplificó rápidamente la presencia local de la marca.")],
]
t = Table(rows, colWidths=[1.25 * inch, 2.55 * inch, 2.95 * inch], repeatRows=1)
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), ORANGE_DARK),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PANEL_2, PANEL]),
    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [t, Spacer(1, 0.14 * inch)]
story += section("Optimización aplicada", "Conservar el alcance y mejorar la conversión")
for text in [
    "<b>Alcance concentrado:</b> la campaña duplicada aportó 72,727 impresiones y la mayor parte del volumen total.",
    "<b>Interés medible:</b> las dos campañas sumaron 1,184 clics en enlaces y 2,475 interacciones.",
    "<b>Control preventivo:</b> ambas campañas fueron pausadas para evaluar ventas antes del próximo lanzamiento.",
    "<b>Próximo enfoque:</b> conservar el alcance, mejorar la conversión y usar límites diarios aprobados.",
]:
    story.append(Paragraph(text, s["BulletES"], bulletText="•"))

dispute = Table([[p(
    "<b>Lectura ejecutiva:</b> la campaña no representa dinero sin resultado. Compró 80,957 impresiones, "
    "1,184 clics en enlaces, 2,475 interacciones y 18 llamadas confirmadas. La oportunidad ahora es medir cuántas de esas acciones terminaron en ventas."
)]], colWidths=[doc.width])
dispute.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#2A1D00")),
    ("BOX", (0, 0), (-1, -1), 0.8, YELLOW),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story += [Spacer(1, 0.07 * inch), dispute, PageBreak()]

# Pagina 3 - Yelp
story += [p("RESULTADOS DE YELP ADS", "Eyebrow"), p("Clientes con intención<br/>de compra.", "Hero")]
story += [p(
    "Yelp complementa el alcance masivo de Meta con usuarios que ya están buscando un negocio local. "
    "La plataforma muestra una contribución directa a visitas, mensajes, llamadas y solicitudes de dirección.",
    "Deck",
)]
story.append(Table(
    [[metric("22.1K", "IMPRESIONES DE ANUNCIOS", ORANGE),
      metric("127", "CLICS EN ANUNCIOS", GREEN),
      metric("80", "LEADS DE ANUNCIOS", GREEN),
      metric("$6.67", "COSTO POR LEAD", GREEN)]],
    colWidths=[1.7 * inch] * 4,
    style=[("VALIGN", (0, 0), (-1, -1), "TOP"),
           ("LEFTPADDING", (0, 0), (-1, -1), 4),
           ("RIGHTPADDING", (0, 0), (-1, -1), 4)],
))
story += [Spacer(1, 0.15 * inch)]
story += section("Rendimiento reciente", "Últimos 30 días")

yelp_rows = [
    [p("Métrica", "Header"), p("Resultado", "Header"), p("Interpretación comercial", "Header")],
    [p("Visitas a la página"), p("63 desde anuncios / 76 totales"),
     p("83% de las visitas a la página fueron impulsadas por publicidad.")],
    [p("Leads"), p("80 desde anuncios / 80 totales"),
     p("El 100% de los leads del periodo fue atribuido a Yelp Ads.")],
    [p("Inversión"), p("$519.89 del 1 al 26 de julio"),
     p("$4.30 por clic y $6.67 por lead registrado.")],
]
yt = Table(yelp_rows, colWidths=[1.45 * inch, 2.0 * inch, 3.3 * inch], repeatRows=1)
yt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), ORANGE_DARK),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PANEL_2, PANEL]),
    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [yt, Spacer(1, 0.15 * inch)]
story += section("Contribución acumulada", "Últimos 12 meses")
story.append(Table(
    [[metric("476", "LEADS TOTALES", ORANGE),
      metric("473", "LEADS DE ANUNCIOS", GREEN),
      metric("445", "MENSAJES", GREEN),
      metric("16", "RUTAS Y MAPAS", GREEN)]],
    colWidths=[1.7 * inch] * 4,
    style=[("VALIGN", (0, 0), (-1, -1), "TOP"),
           ("LEFTPADDING", (0, 0), (-1, -1), 4),
           ("RIGHTPADDING", (0, 0), (-1, -1), 4)],
))
story += [Spacer(1, 0.14 * inch)]
yelp_note = Table([[p(
    "<b>Lectura ejecutiva:</b> Yelp funciona como canal de alta intención. Mientras Meta construye alcance, "
    "Yelp captura personas que buscan una solución local y facilita el contacto por mensajes, llamadas y direcciones."
)]], colWidths=[doc.width])
yelp_note.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#2A1D00")),
    ("BOX", (0, 0), (-1, -1), 0.8, YELLOW),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story += [yelp_note, PageBreak()]

# Pagina 4
story += [p("SIGUIENTE ETAPA", "Eyebrow"), p("Convertir visibilidad<br/>en ventas medibles.", "Hero")]
story += [p(
    "Meta construyó alcance, Google generó 149 clics y 26 conversiones en siete días, y Yelp produjo leads de alta intención. "
    "La siguiente etapa debe conectar cada llamada, cita y factura con su plataforma para demostrar el retorno completo.",
    "Deck",
)]
steps = [
    ("1", "Medir ventas originadas", "Relacionar las 18 llamadas y los clics con citas, facturas y clientes nuevos."),
    ("2", "Relanzar la mejor campaña", "Usar una sola campaña con el creativo y la audiencia que produjeron mayor intención."),
    ("3", "Optimizar conversiones", "Medir llamadas, formularios, rutas hacia el taller y citas confirmadas."),
    ("4", "Escalar con límites", "Aumentar el presupuesto solamente cuando el costo por cliente sea rentable."),
    ("5", "Reporte semanal", "Presentar impresiones, clics, llamadas, citas, ventas y retorno estimado cada semana."),
]
step_rows = []
for number, title, body in steps:
    badge = Table([[p(number, "Header")]], colWidths=[0.34 * inch], rowHeights=[0.34 * inch])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ORANGE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    step_rows.append([badge, [p(title, "H3"), p(body)]])
t = Table(step_rows, colWidths=[0.48 * inch, doc.width - 0.48 * inch])
t.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (1, 0), (1, -2), 0.5, LINE),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
]))
story += [t, Spacer(1, 0.14 * inch)]
story += section("Mensaje recomendado para el propietario", "Directo, responsable y constructivo")
quote = Table([[p(
    "“La estrategia digital colocó a Tires SOS frente al mercado local más de 80 mil veces en Meta, produjo 26 conversiones "
    "en Google y generó 80 leads recientes en Yelp. Cada canal cumplió una función diferente: Meta creó visibilidad, Google capturó búsquedas "
    "y Yelp conectó clientes de alta intención. El siguiente paso es vincular estos resultados con citas y ventas para escalar lo más rentable.”",
    "Quote",
)]], colWidths=[doc.width])
quote.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), ORANGE_DARK),
    ("BOX", (0, 0), (-1, -1), 0.8, ORANGE),
    ("LEFTPADDING", (0, 0), (-1, -1), 15),
    ("RIGHTPADDING", (0, 0), (-1, -1), 15),
    ("TOPPADDING", (0, 0), (-1, -1), 13),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
]))
story += [quote, Spacer(1, 0.14 * inch), p("Nota sobre los datos", "H3")]
story += [p(
    "Preparado con datos de Meta Ads Manager, Google Ads, Yelp for Business y el panel de analítica revisados el 27 de julio de 2026. "
    "Meta y Google reflejan siete a ocho días; Yelp refleja los últimos 30 días y su contribución acumulada de 12 meses. "
    "No se sumaron periodos diferentes como si fueran equivalentes.",
    "Muted",
)]

doc.build(story)
print(OUT)
