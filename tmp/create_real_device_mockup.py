from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(r"C:\Users\Alexander\Desktop\Tires-SOS")
OUT = ROOT / "output" / "mockups"

captures = {
    "desktop": (OUT / "desktop-full.png", (142, 2594, 142 + 1140, 2594 + 761)),
    "laptop": (OUT / "laptop-full.png", (20, 2543, 20 + 1125, 2543 + 682)),
    "mobile": (OUT / "mobile-full.png", (12, 1520, 12 + 350, 1520 + 1058)),
}

screens = {}
for name, (path, crop) in captures.items():
    screens[name] = Image.open(path).convert("RGB").crop(crop)
    screens[name].save(OUT / f"{name}-component-real.png", quality=96)

W, H = 2048, 1280
canvas = Image.new("RGB", (W, H), "#090909")

# Subtle automotive studio background.
bg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
bd = ImageDraw.Draw(bg)
for y in range(H):
    v = int(16 + 12 * y / H)
    bd.line((0, y, W, y), fill=(v, v, v, 255))
bd.ellipse((-500, 680, 1100, 1540), fill=(245, 82, 0, 32))
bd.ellipse((1080, -500, 2480, 800), fill=(245, 82, 0, 18))
bg = bg.filter(ImageFilter.GaussianBlur(90))
canvas = Image.alpha_composite(canvas.convert("RGBA"), bg)


def shadow_box(box, radius=30, blur=34, opacity=150):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0 + 18, x1, y1 + 18), radius=radius, fill=(0, 0, 0, opacity))
    return layer.filter(ImageFilter.GaussianBlur(blur))


def fit_screen(source, size):
    frame = Image.new("RGB", size, "#050505")
    copy = source.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    frame.paste(copy, (x, y))
    return frame


def rounded_paste(base, image, xy, radius):
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width, image.height), radius=radius, fill=255)
    base.alpha_composite(Image.composite(image.convert("RGBA"), Image.new("RGBA", image.size), mask), xy)


# Desktop display.
monitor_outer = (384, 28, 1664, 902)
canvas = Image.alpha_composite(canvas, shadow_box(monitor_outer, 34, 42, 185))
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle(monitor_outer, radius=34, fill="#151515", outline="#4b4b4b", width=3)
monitor_screen = fit_screen(screens["desktop"], (1218, 812))
rounded_paste(canvas, monitor_screen, (415, 58), 17)
draw.rounded_rectangle((988, 902, 1060, 1042), radius=14, fill="#242424", outline="#4a4a4a", width=2)
draw.rounded_rectangle((824, 1028, 1224, 1066), radius=18, fill="#1b1b1b", outline="#3a3a3a", width=2)

# Laptop in front-left.
laptop_outer = (72, 585, 1110, 1210)
canvas = Image.alpha_composite(canvas, shadow_box(laptop_outer, 28, 38, 190))
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle((105, 585, 1076, 1180), radius=26, fill="#171717", outline="#555", width=3)
laptop_screen = fit_screen(screens["laptop"], (900, 545))
rounded_paste(canvas, laptop_screen, (140, 610), 12)
draw.polygon([(60, 1175), (1125, 1175), (1040, 1252), (150, 1252)], fill="#292929", outline="#555")
draw.rounded_rectangle((450, 1186, 735, 1236), radius=14, fill="#202020", outline="#3d3d3d")

# Phone in front-right.
phone_outer = (1682, 510, 1964, 1218)
canvas = Image.alpha_composite(canvas, shadow_box(phone_outer, 48, 38, 190))
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle(phone_outer, radius=48, fill="#111", outline="#5a5a5a", width=3)
phone_screen = fit_screen(screens["mobile"], (224, 676))
rounded_paste(canvas, phone_screen, (1711, 530), 31)
draw.rounded_rectangle((1760, 526, 1886, 539), radius=7, fill="#050505")

# Ground and restrained orange accent.
draw.line((0, 1238, W, 1238), fill=(248, 96, 0, 120), width=2)
canvas = canvas.convert("RGB")
final_path = OUT / "tires-sos-commercial-vans-real-screens-mockup.png"
canvas.save(final_path, quality=96)
print(final_path)
