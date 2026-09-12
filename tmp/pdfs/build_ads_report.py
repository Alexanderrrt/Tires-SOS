from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter
import os

ROOT = r"C:\Users\Alexander\Desktop\Tires-SOS"
OUT = os.path.join(ROOT, "output", "pdf", "tires-sos-google-ads-redesign.pdf")
COVER = os.path.join(ROOT, "tmp", "pdfs", "cover.pdf")
SOURCE = r"C:\Users\Alexander\Downloads\Informe de detalles del grupo de recursos.pdf"
LOGO = os.path.join(ROOT, "public", "logo.jpg")

W, H = landscape(letter)
dark = colors.HexColor("#20252B")
panel = colors.HexColor("#2B3239")
orange = colors.HexColor("#FF5A1F")
blue = colors.HexColor("#28A9E0")
muted = colors.HexColor("#B8C0C7")
white = colors.white

def rounded_box(c, x, y, w, h, fill, stroke=None, radius=12):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)

def draw_metric(c, x, y, w, h, number, label, color=orange):
    rounded_box(c, x, y, w, h, panel)
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(x + 18, y + h - 43, number)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 18, y + 20, label.upper())

def create_cover():
    c = canvas.Canvas(COVER, pagesize=landscape(letter))
    c.setFillColor(dark)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(orange)
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)
    if os.path.exists(LOGO):
        c.drawImage(ImageReader(LOGO), 34, H - 108, width=92, height=58, preserveAspectRatio=True, mask='auto')
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 23)
    c.drawString(145, H - 55, "Tires SOS Rescue")
    c.setFillColor(orange)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(145, H - 80, "Reporte de campaña en Google Ads")
    c.setFillColor(muted)
    c.setFont("Helvetica", 11)
    c.drawString(145, H - 99, "23 de julio de 2026 - 21 de agosto de 2026")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(34, H - 146, "RESUMEN EJECUTIVO")
    c.setFillColor(muted)
    c.setFont("Helvetica", 10)
    c.drawString(34, H - 164, "Una lectura clara del alcance, la demanda y los servicios que más interés generan.")

    gap = 14
    box_y = H - 280
    box_w = (W - 68 - gap * 2) / 3
    draw_metric(c, 34, box_y, box_w, 94, "7.23K", "impresiones de anuncios", orange)
    draw_metric(c, 34 + box_w + gap, box_y, box_w, 94, "175", "clics de clientes potenciales", blue)
    draw_metric(c, 34 + (box_w + gap) * 2, box_y, box_w, 94, "3 tiendas", "San Jose y Hayward", orange)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(34, H - 325, "SERVICIOS CON MAS INTERES")
    rows = [
        ("Cambio de aceite, fluidos y presión de llantas", "297 clics", orange),
        ("Opciones de pago flexible - Snap Finance y Afterpay", "121 clics", blue),
        ("Servicio bilingüe - Se habla español", "107 clics", orange),
    ]
    y = H - 365
    for label, value, accent in rows:
        rounded_box(c, 34, y, W - 68, 29, colors.HexColor("#262C32"))
        c.setFillColor(accent)
        c.rect(34, y, 5, 29, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(51, y + 10, label)
        c.setFillColor(accent)
        c.drawRightString(W - 51, y + 10, value)
        y -= 37

    rounded_box(c, 34, 47, W - 68, 60, colors.HexColor("#11161B"), stroke=colors.HexColor("#58636C"))
    c.setFillColor(orange)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(53, 82, "RESULTADO")
    c.setFillColor(white)
    c.setFont("Helvetica", 12)
    c.drawString(165, 82, "Un flujo constante de clientes locales de alta intención.")
    c.setFillColor(muted)
    c.setFont("Helvetica", 9)
    c.drawString(53, 63, "El detalle completo de recursos, clics, conversiones y costos se incluye en las páginas siguientes.")
    c.setFillColor(muted)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 34, 20, "Fuente: exportacion de Google Ads proporcionada por el anunciante")
    c.showPage()
    c.save()

def merge():
    create_cover()
    writer = PdfWriter()
    for p in (COVER, SOURCE):
        reader = PdfReader(p)
        for page in reader.pages:
            writer.add_page(page)
    with open(OUT, "wb") as f:
        writer.write(f)

if __name__ == "__main__":
    merge()
    print(OUT)
