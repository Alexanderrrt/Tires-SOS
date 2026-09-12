from PIL import Image
import os

src = r"C:\Users\Alexander\Desktop\Tires-SOS\public\hayward-storefront.png"
out_dir = r"C:\Users\Alexander\Desktop\Tires-SOS\tmp\google-ads"
os.makedirs(out_dir, exist_ok=True)
im = Image.open(src).convert("RGB")
# 4:5 portrait crops from the real Hayward storefront photo.
for name, left in [("hayward-entrance-vertical.jpg", 580), ("hayward-service-vertical.jpg", 250)]:
    crop = im.crop((left, 0, left + 868, 1086))
    crop = crop.resize((1080, 1350), Image.Resampling.LANCZOS)
    crop.save(os.path.join(out_dir, name), quality=94, optimize=True)
