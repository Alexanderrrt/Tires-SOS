from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "propuesta-google-ads-para-propietario.pdf"
ART = ROOT / "output" / "pdf" / "assets" / "crecimiento-google-ads.png"
LOGO = ROOT / "public" / "logo-mark.png"

INK = colors.HexColor("#111820")
ORANGE = colors.HexColor("#F25A24")
GREEN = colors.HexColor("#11865B")
GRAY = colors.HexColor("#66727E")
PALE = colors.HexColor("#F2F4F6")
CREAM = colors.HexColor("#FFF5ED")

def style(name, size, leading, color=INK, bold=False, align=0, before=0, after=0):
    return ParagraphStyle(name, fontName="Helvetica-Bold" if bold else "Helvetica",
                          fontSize=size, leading=leading, textColor=color,
                          alignment=align, spaceBefore=before, spaceAfter=after)

S = {
    "eyebrow": style("eyebrow", 9, 11, ORANGE, True, after=5),
    "title": style("title", 24, 27, INK, True, after=8),
    "lead": style("lead", 11, 15, GRAY, after=10),
    "h2": style("h2", 16, 19, INK, True, before=8, after=7),
    "body": style("body", 10, 14, INK),
    "small": style("small", 8, 11, GRAY),
    "big": style("big", 24, 27, INK, True, 1),
    "label": style("label", 8, 10, GRAY, True, 1),
}

def P(text, key="body"):
    return Paragraph(text, S[key])

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D5DADE"))
    canvas.line(0.65*inch, 0.48*inch, 7.85*inch, 0.48*inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GRAY)
    canvas.drawString(0.65*inch, 0.30*inch, "Tires SOS Rescue | Propuesta para el propietario")
    canvas.drawRightString(7.85*inch, 0.30*inch, f"Página {doc.page}")
    canvas.restoreState()

def card(value, label, color=INK):
    big = ParagraphStyle("v"+label, parent=S["big"], textColor=color)
    return [Paragraph(value, big), P(label, "label")]

def cards(items):
    t = Table([[card(*x) for x in items]], colWidths=[1.78*inch]*len(items), rowHeights=[0.82*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),PALE),("BOX",(0,0),(-1,-1),0.6,colors.HexColor("#D5DADE")),
        ("INNERGRID",(0,0),(-1,-1),0.6,colors.HexColor("#D5DADE")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(-1,-1),7),("RIGHTPADDING",(0,0),(-1,-1),7),
    ]))
    return t

doc = SimpleDocTemplate(str(OUT), pagesize=letter, leftMargin=0.65*inch, rightMargin=0.65*inch,
                        topMargin=0.48*inch, bottomMargin=0.65*inch,
                        title="Propuesta de Google Ads para el propietario")
story = []

head = Table([[Image(str(LOGO), 1.35*inch, 0.71*inch), P("PROPUESTA DE GOOGLE ADS<br/><font color='#66727E' size='8'>12 de agosto de 2026</font>", "eyebrow")]],
             colWidths=[1.55*inch, 5.65*inch])
head.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
story += [head, Spacer(1,0.08*inch), P("Google propone invertir más para conseguir más clientes", "title")]
story.append(P("Esta es una propuesta para considerar. <b>No se cambió el presupuesto.</b>", "lead"))

hero = Image(str(ART), width=7.2*inch, height=2.55*inch)
story += [hero, Spacer(1,0.12*inch)]

story.append(cards([
    ("$9.50", "PRESUPUESTO ACTUAL POR DÍA", INK),
    ("$17.00", "PRESUPUESTO PROPUESTO POR DÍA", ORANGE),
    ("+47%", "MÁS CONVERSIONES PROYECTADAS", GREEN),
    ("+22%", "MAYOR COSTO POR CLIENTE", ORANGE),
]))

story.append(P("En palabras simples", "h2"))
simple = Table([
    [P("1", "big"), P("Google cree que hay demanda adicional que la campaña actual no alcanza por falta de presupuesto.")],
    [P("2", "big"), P("El aumento permitiría mostrar más anuncios y podría generar más llamadas y formularios.")],
    [P("3", "big"), P("El crecimiento tendría un costo: Google proyecta que cada conversión sería aproximadamente 22% más cara.")],
], colWidths=[0.55*inch,6.65*inch])
simple.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(0,-1),CREAM),("TEXTCOLOR",(0,0),(0,-1),ORANGE),
    ("BOX",(0,0),(-1,-1),0.7,colors.HexColor("#D5DADE")),("INNERGRID",(0,0),(-1,-1),0.5,colors.HexColor("#D5DADE")),
    ("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10),
    ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
]))
story.append(simple)

story.append(PageBreak())
story.append(P("¿Vale la pena?", "title"))
story.append(P("La campaña activa ya está produciendo resultados. La decisión depende de si el taller desea más volumen y puede atenderlo.", "lead"))

story.append(cards([
    ("23", "CONVERSIONES", GREEN),
    ("224", "CLICS", INK),
    ("5,777", "IMPRESIONES", INK),
    ("$6.57", "COSTO ACTUAL POR CONVERSIÓN", GREEN),
]))

story.append(P("Costo máximo adicional", "h2"))
story.append(cards([
    ("+$7.50", "POR DÍA", ORANGE),
    ("+$52.50", "POR SEMANA", ORANGE),
    ("+$228", "POR MES APROXIMADO", ORANGE),
    ("$8.02", "CPA DE REFERENCIA PARA REVISAR", GREEN),
]))

story.append(P("Tres decisiones posibles", "h2"))
opts = Table([
    [P("OPCIÓN", "label"), P("QUÉ SIGNIFICA", "label"), P("RECOMENDACIÓN", "label")],
    [P("Aprobar $17/día"), P("Aceptar la propuesta completa de Google."), P("Usarla solo si el taller puede atender más clientes y acepta un CPA mayor.")],
    [P("Probar $13/día"), P("Aumentar poco a poco durante 14 días."), P("La opción más prudente para comprobar resultados antes del aumento completo.")],
    [P("Mantener $9.50/día"), P("No cambiar nada por ahora."), P("Adecuada si se desea proteger el gasto actual y la eficiencia.")],
], colWidths=[1.45*inch,2.15*inch,3.6*inch])
opts.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),INK),("TEXTCOLOR",(0,0),(-1,0),colors.white),
    ("BACKGROUND",(0,2),(-1,2),colors.HexColor("#EDF7F2")),
    ("BOX",(0,0),(-1,-1),0.6,colors.HexColor("#D5DADE")),("INNERGRID",(0,0),(-1,-1),0.6,colors.HexColor("#D5DADE")),
    ("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),
    ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
]))
story.append(opts)

story.append(P("Recomendación sencilla", "h2"))
rec = Table([[P("<b>Probar $13 por día durante 14 días.</b> Después, comparar el número de conversiones y el costo por conversión. Si mejora el volumen sin pasar aproximadamente de $8.02 por conversión, considerar subir a $17 por día.")]], colWidths=[7.2*inch])
rec.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#E8F5EF")),("BOX",(0,0),(-1,-1),1,GREEN),
                         ("LEFTPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),12),("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),10)]))
story += [rec, Spacer(1,0.12*inch)]

decision = Table([
    [P("[ ] Aprobar $17/día"), P("[ ] Aprobar prueba de $13/día"), P("[ ] Mantener $9.50/día")],
    [P("Firma: __________________", "small"), P("Fecha: __________________", "small"), P("Revisión: ________________", "small")],
], colWidths=[2.4*inch]*3)
decision.setStyle(TableStyle([("BOX",(0,0),(-1,-1),0.7,colors.HexColor("#D5DADE")),("INNERGRID",(0,0),(-1,-1),0.7,colors.HexColor("#D5DADE")),
                              ("LEFTPADDING",(0,0),(-1,-1),9),("RIGHTPADDING",(0,0),(-1,-1),9),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9)]))
story += [decision, Spacer(1,0.1*inch), P("Fuente: recomendación y simulación visibles en Google Ads el 12 de agosto de 2026. La recomendación no fue aplicada.", "small")]

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
