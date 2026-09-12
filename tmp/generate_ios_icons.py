from pathlib import Path
from PIL import Image, ImageFilter

root = Path(r"C:\Users\Alexander\Desktop\Tires-SOS")
source = Image.open(root / "public" / "logo-mark.png").convert("RGBA")

bbox = source.getbbox()
if bbox:
    source = source.crop(bbox)

for size, filename in [
    (180, "apple-touch-icon.png"),
    (180, "apple-touch-icon-v2.png"),
    (152, "apple-touch-icon-152.png"),
    (192, "icon-192.png"),
    (512, "icon-512.png"),
]:
    icon = Image.new("RGBA", (size, size), "#080808")
    logo = source.copy()
    logo.thumbnail((int(size * .9), int(size * .7)), Image.Resampling.LANCZOS)
    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    icon.alpha_composite(logo, (x, y))
    icon.convert("RGB").save(root / "public" / filename, "PNG", optimize=True)
