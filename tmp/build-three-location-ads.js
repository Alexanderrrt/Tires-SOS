const sharp = require('sharp');
const fs = require('fs');

const src = 'public/storefront-3-locations.png';
const outDir = 'output/ads';
fs.mkdirSync(outDir, { recursive: true });

function svg(width, height, vertical = false) {
  const titleY = vertical ? 92 : 82;
  const subY = vertical ? 150 : 138;
  const cardY = vertical ? 205 : 190;
  const cardH = 432;
  const footerY = vertical ? 1005 : 705;
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07090c"/><stop offset=".55" stop-color="#171b20"/><stop offset="1" stop-color="#050608"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect x="0" y="0" width="100%" height="${vertical ? 184 : 172}" fill="#07090c"/>
    <text x="${width/2}" y="${titleY}" text-anchor="middle" fill="#ff6a00" font-family="Arial, sans-serif" font-size="${vertical ? 62 : 58}" font-weight="900" letter-spacing="2">3 UBICACIONES</text>
    <text x="${width/2}" y="${subY}" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="${vertical ? 30 : 28}" font-weight="700" letter-spacing="1">SAN JOSÉ  •  HAYWARD</text>
    <rect x="28" y="${cardY}" width="${width-56}" height="${cardH}" rx="20" fill="#11151a" stroke="#ff6a00" stroke-width="3"/>
    <rect x="28" y="${cardY}" width="${width-56}" height="${cardH}" rx="20" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="1"/>
    <text x="${width/2}" y="${footerY}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${vertical ? 31 : 30}" font-weight="800">ENCUENTRA TU TALLER MÁS CERCANO</text>
    <text x="${width/2}" y="${footerY+48}" text-anchor="middle" fill="#ff6a00" font-family="Arial, sans-serif" font-size="${vertical ? 28 : 27}" font-weight="700">tiressosrescue.com</text>
  </svg>`;
}

async function make(name, width, height, vertical) {
  const cardW = width - 56;
  const cardH = 432;
  const card = await sharp(src).resize(cardW, cardH, { fit: 'contain', background: '#11151a' }).png().toBuffer();
  await sharp(Buffer.from(svg(width, height, vertical)))
    .composite([{ input: card, left: 28, top: vertical ? 205 : 190 }])
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/${name}.png`);
}

(async () => {
  await make('tires-sos-three-locations-square', 1080, 1080, false);
  await make('tires-sos-three-locations-vertical', 1080, 1350, true);
})();
