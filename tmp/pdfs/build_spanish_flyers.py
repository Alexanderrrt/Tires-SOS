from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "flyers"
OUT.mkdir(parents=True, exist_ok=True)
BG_PATH = OUT / "tire-background.png"
LOGO_PATH = ROOT / "public" / "logo-mark.png"

W, H = 2160, 2700
ORANGE = "#ff5a18"
AMBER = "#ffc247"
WHITE = "#ffffff"
MUTED = "#edf0f4"
CARD = (12, 16, 22, 242)
RED = "#ff735f"
GREEN = "#46df8a"
FONT = Path("C:/Windows/Fonts/arialbd.ttf")
BOLD = Path("C:/Windows/Fonts/arialbd.ttf")


def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)


def base():
    bg = Image.open(BG_PATH).convert("RGB")
    scale = max(W / bg.width, H / bg.height)
    bg = bg.resize((int(bg.width * scale), int(bg.height * scale)), Image.Resampling.LANCZOS)
    bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width + W) // 2, (bg.height + H) // 2))
    bg = ImageEnhance.Brightness(bg).enhance(0.55).filter(ImageFilter.GaussianBlur(0.6)).convert("RGBA")
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rectangle((0, 0, W, H), fill=(2, 4, 7, 72))
    sd.rectangle((0, 0, 1450, H), fill=(2, 4, 7, 120))
    return Image.alpha_composite(bg, shade)


def add_logo(im):
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo.thumbnail((430, 250), Image.Resampling.LANCZOS)
    im.alpha_composite(logo, (125, 90))


def rounded(draw, box, fill, outline=None, width=3, radius=34):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, size, color=WHITE, bold=False, anchor=None):
    draw.text(xy, value, font=font(size, bold), fill=color, anchor=anchor)


def wrap(draw, value, max_width, size, bold=False):
    words = value.split()
    lines, line = [], ""
    f = font(size, bold)
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textbbox((0, 0), trial, font=f)[2] <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def paragraph(draw, xy, value, max_width, size, color=MUTED, bold=False, gap=10):
    x, y = xy
    for line in wrap(draw, value, max_width, size, bold):
        text(draw, (x, y), line, size, color, bold)
        y += size + gap
    return y


def footer(draw, label):
    draw.line((120, 2570, 2040, 2570), fill=(255, 255, 255, 70), width=3)
    text(draw, (120, 2600), "GRACIAS POR SER PARTE DEL CRECIMIENTO DE TIRES SOS.", 29, MUTED, True)
    text(draw, (2040, 2600), label, 31, ORANGE, True, "ra")


def flyer_one():
    im = base()
    draw = ImageDraw.Draw(im, "RGBA")
    add_logo(im)
    text(draw, (2040, 125), "REPORTE SEMANAL", 40, ORANGE, True, "ra")
    text(draw, (2040, 182), "1-6 AGO 2026", 34, MUTED, True, "ra")

    text(draw, (120, 390), "EL SITIO SÍ", 98, WHITE, True)
    text(draw, (120, 495), "GENERÓ INTERÉS", 98, ORANGE, True)
    paragraph(draw, (125, 625), "Un resumen positivo de alcance, actividad e interés de clientes.", 1450, 39, WHITE)

    metrics = [("108", "VISITANTES"), ("115", "SESIONES"), ("157", "PÁGINAS VISTAS"), ("13", "MENSAJES")]
    x0, y0, cw, ch, gap = 120, 760, 455, 330, 30
    for i, (value, label) in enumerate(metrics):
        x = x0 + i * (cw + gap)
        rounded(draw, (x, y0, x + cw, y0 + ch), CARD, ORANGE, 5, 30)
        text(draw, (x + cw // 2, y0 + 92), value, 110, WHITE, True, "mm")
        text(draw, (x + cw // 2, y0 + 245), label, 31, MUTED, True, "mm")

    rounded(draw, (120, 1150, 1490, 1650), (18, 22, 28, 238), GREEN, 6, 40)
    text(draw, (185, 1210), "INTERÉS GENERADO", 38, GREEN, True)
    text(draw, (185, 1300), "13 MENSAJES", 118, WHITE, True)
    text(draw, (185, 1435), "DE CLIENTES", 58, WHITE, True)
    paragraph(draw, (185, 1530), "Los visitantes utilizaron el sitio para iniciar conversaciones directas con Tires SOS.", 1200, 40, MUTED)

    rounded(draw, (120, 1715, 780, 2070), CARD, ORANGE, 4, 34)
    text(draw, (180, 1770), "88%", 112, WHITE, True)
    text(draw, (180, 1895), "DEL TRÁFICO ES MÓVIL", 35, ORANGE, True)
    paragraph(draw, (180, 1960), "La mayoría de las visitas llegó desde teléfonos.", 530, 35, MUTED)

    rounded(draw, (820, 1715, 1490, 2070), CARD, AMBER, 4, 34)
    text(draw, (880, 1770), "94.7%", 105, WHITE, True)
    text(draw, (880, 1895), "AUDIENCIA EN EE. UU.", 34, AMBER, True)
    paragraph(draw, (880, 1960), "La mayoría del tráfico llegó del mercado principal.", 540, 35, MUTED)

    rounded(draw, (120, 2140, 1490, 2475), (255, 90, 24, 235), None, 0, 38)
    text(draw, (185, 2190), "RESULTADO DE LA SEMANA", 34, "#180b05", True)
    paragraph(draw, (185, 2270), "108 visitantes generaron 18 clics de contacto, 20 aperturas del chat y 13 mensajes.", 1200, 50, "#ffffff", True, 14)
    footer(draw, "01 / 02")
    path = OUT / "tires-sos-flyer-resultados.png"
    im.convert("RGB").save(path, quality=96, dpi=(300, 300))
    return path


def flyer_two():
    im = base()
    draw = ImageDraw.Draw(im, "RGBA")
    add_logo(im)
    text(draw, (2040, 125), "VISTA DEL PROPIETARIO", 40, ORANGE, True, "ra")
    text(draw, (2040, 182), "1-6 AGO 2026", 34, MUTED, True, "ra")

    text(draw, (120, 390), "ASÍ RESPONDIÓ", 102, WHITE, True)
    text(draw, (120, 500), "LA AUDIENCIA", 102, ORANGE, True)
    paragraph(draw, (125, 630), "Interacción, perfil del visitante y calidad de la experiencia.", 1500, 40, WHITE)

    items = [
        ("18", "CLICS DE CONTACTO", "Personas que tocaron una opción para comunicarse con Tires SOS."),
        ("20", "APERTURAS DEL CHAT", "Visitantes que mostraron intención de iniciar una conversación."),
        ("13", "MENSAJES ENVIADOS", "Interacciones directas registradas durante el periodo."),
    ]
    y = 785
    for number, title_value, body in items:
        rounded(draw, (120, y, 1620, y + 455), CARD, ORANGE if number != "02" else AMBER, 5, 38)
        rounded(draw, (165, y + 55, 390, y + 280), (255, 90, 24, 245) if number != "02" else (255, 194, 71, 245), None, 0, 28)
        text(draw, (278, y + 168), number, 82, "#111111", True, "mm")
        text(draw, (455, y + 72), title_value, 44, WHITE, True)
        paragraph(draw, (455, y + 155), body, 1060, 38, MUTED, False, 14)
        y += 500

    rounded(draw, (120, 2305, 1620, 2495), (255, 90, 24, 235), None, 0, 36)
    text(draw, (870, 2372), "88% MÓVIL  •  94.7% EE. UU.", 43, WHITE, True, "mm")
    text(draw, (870, 2440), "0 ERRORES JS  •  0 DEAD CLICKS", 32, WHITE, True, "mm")
    footer(draw, "02 / 02")
    path = OUT / "tires-sos-flyer-audiencia.png"
    im.convert("RGB").save(path, quality=96, dpi=(300, 300))
    return path


if __name__ == "__main__":
    print(flyer_one())
    print(flyer_two())
