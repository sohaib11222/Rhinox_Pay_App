/**
 * Generates centered Expo app icons from the brand PNG source.
 * Source: ../PNG Transparent/3.1_1.png (green rhino mark, best optical centering)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE = path.resolve(__dirname, '../../PNG Transparent/3.1_1.png');
const OUT_DIR = path.resolve(__dirname, '../assets');
const SIZE = 1024;
const APP_BG = { r: 2, g: 12, b: 25, alpha: 1 }; // #020c19

function isContent(r, g, b, a) {
  if (a < 10) return false;
  return r + g + b > 25 || g > 40;
}

async function extractContentBounds(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4;
      if (isContent(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  return { left: minX, top: minY, width, height };
}

async function cropContentBuffer(inputPath) {
  const bounds = await extractContentBounds(inputPath);
  return sharp(inputPath).extract(bounds).png().toBuffer();
}

async function writeCenteredIcon({
  outputName,
  contentScale,
  background = APP_BG,
  transparentBackground = false,
}) {
  const cropped = await cropContentBuffer(SOURCE);
  const contentSize = Math.round(SIZE * contentScale);

  const logo = await sharp(cropped)
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const canvas = sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: transparentBackground ? { r: 0, g: 0, b: 0, alpha: 0 } : background,
    },
  }).composite([{ input: logo, gravity: 'center' }]);

  const outPath = path.join(OUT_DIR, outputName);
  await canvas.png().toFile(outPath);
  console.log('Created', outPath, `(scale ${contentScale})`);
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Source icon not found: ${SOURCE}`);
  }

  await writeCenteredIcon({ outputName: 'icon.png', contentScale: 0.68 });
  await writeCenteredIcon({
    outputName: 'adaptive-icon.png',
    contentScale: 0.56,
    transparentBackground: true,
  });
  await writeCenteredIcon({ outputName: 'splash-icon.png', contentScale: 0.52 });
  await writeCenteredIcon({ outputName: 'favicon.png', contentScale: 0.68 });
  await writeCenteredIcon({ outputName: 'rhinox_icon_mark.png', contentScale: 0.68 });

  console.log('App icons generated successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
