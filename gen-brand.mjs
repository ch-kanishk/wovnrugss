/**
 * Build-time brand asset generation.
 * Traces the supplied WOVN RUGS logo into SVGs (mark, lockup, full) plus the
 * favicon and OG image. Run once; the outputs are committed to public/.
 */
import { promises as fs } from 'fs';
import sharp from 'sharp';
import potrace from 'potrace';

// The master artwork. Replace this file and re-run `npm run brand` to rebuild
// every derived asset (header lockups, favicon, OG card).
const SRC = 'assets/logo-source.png';

// Content bands measured from the source (see analyze step)
const BOX = {
  mark:   { left: 46,  top: 112, width: 384, height: 202 },   // WR monogram
  lockup: { left: 46,  top: 112, width: 384, height: 249 },   // monogram + WOVN RUGS
  full:     { left: 46,  top: 112, width: 384, height: 316 },   // + tagline
  wordmark: { left: 153, top: 337, width: 192, height: 24 },    // "WOVN RUGS" alone
};

function trace(buffer, opts = {}) {
  return new Promise((resolve, reject) => {
    potrace.trace(buffer, { threshold: 128, turdSize: 3, optCurve: true, optTolerance: 0.3, alphaMax: 1, ...opts },
      (err, svg) => (err ? reject(err) : resolve(svg)));
  });
}

/**
 * Trace at 2x and rewrite the SVG header so the artwork scales freely.
 * 2x is the sweet spot here: visually identical to a 4x trace but ~5x smaller,
 * because a higher upscale multiplies nodes along the antialiased edges.
 */
async function makeSvg(box, name, color) {
  const scale = 2;
  const png = await sharp(SRC)
    .flatten({ background: '#ffffff' })
    .extract(box)
    .resize({ width: box.width * scale, kernel: 'lanczos3' })
    .greyscale()
    .threshold(140)
    .png()
    .toBuffer();

  let svg = await trace(png, { color });

  const w = box.width * scale, h = box.height * scale;
  svg = svg.replace(
    /<svg[^>]*>/,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${box.width}" height="${box.height}" role="img" aria-label="Wovn Rugs">`
  );
  await fs.writeFile(`public/brand/${name}.svg`, svg);
  const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);
  console.log(`  public/brand/${name}.svg  (${box.width}x${box.height}, ${kb} kB)`);
  return svg;
}

console.log('Tracing logo →');
await makeSvg(BOX.mark, 'mark', '#000000');
await makeSvg(BOX.mark, 'mark-light', '#ffffff');
await makeSvg(BOX.lockup, 'lockup', '#000000');
await makeSvg(BOX.lockup, 'lockup-light', '#ffffff');
await makeSvg(BOX.full, 'logo', '#000000');
await makeSvg(BOX.wordmark, 'wordmark', '#000000');
await makeSvg(BOX.wordmark, 'wordmark-light', '#ffffff');

/**
 * Horizontal lockup for the site header. The stacked logo puts "WOVN RUGS"
 * under the monogram, which is illegible at a 40-50px header height, so the
 * mark and wordmark are recomposed side by side from the same artwork.
 */
async function makeHorizontal(tone) {
  const suffix = tone === 'light' ? '-light' : '';
  const read = async (n) => {
    const raw = await fs.readFile(`public/brand/${n}${suffix}.svg`, 'utf8');
    const [, w, h] = raw.match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
    return { inner: raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), w, h };
  };
  const mark = await read('mark');
  const word = await read('wordmark');

  const H = mark.h;                          // lockup height = mark height
  const wordW = mark.w * 1.15;               // wordmark set slightly wider than the mark
  const wordScale = wordW / word.w;
  const gap = H * 0.2;
  const total = mark.w + gap + wordW;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(total)} ${H}" role="img" aria-label="Wovn Rugs">
  <g>${mark.inner}</g>
  <g transform="translate(${Math.round(mark.w + gap)} ${Math.round((H - word.h * wordScale) / 2)}) scale(${wordScale.toFixed(4)})">${word.inner}</g>
</svg>`;
  await fs.writeFile(`public/brand/lockup-h${suffix}.svg`, svg);
  console.log(`  public/brand/lockup-h${suffix}.svg  (${Math.round(total)}x${H})`);
  return { w: Math.round(total), h: H };
}
const hDims = await makeHorizontal('dark');
await makeHorizontal('light');
console.log(`  -> horizontal ratio ${(hDims.w / hDims.h).toFixed(4)}`);

// ---- Favicon: white mark on the brand dark square, readable on any tab colour
const markLight = await fs.readFile('public/brand/mark-light.svg', 'utf8');
const inner = markLight.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const markVb = markLight.match(/viewBox="0 0 (\d+) (\d+)"/);
const [, mw, mh] = markVb.map(Number);
const pad = 0.16;
const side = Math.max(mw, mh) * (1 + pad * 2);
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="64" height="64">
  <rect width="${side}" height="${side}" rx="${side * 0.14}" fill="#1c1a17"/>
  <g transform="translate(${(side - mw) / 2} ${(side - mh) / 2})">${inner}</g>
</svg>`;
await fs.writeFile('public/favicon.svg', favicon);
console.log('  public/favicon.svg');

// ---- Open Graph card: white lockup + tagline on brand dark
const lockupLight = await fs.readFile('public/brand/lockup-light.svg', 'utf8');
const lockInner = lockupLight.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const [, lw, lh] = lockupLight.match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
const target = 620;                       // rendered lockup width on the card
const s = target / lw;
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#1c1a17"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="#996d43" stroke-width="2"/>
  <g transform="translate(${(1200 - target) / 2} ${(630 - lh * s) / 2 - 26}) scale(${s})">${lockInner}</g>
  <text x="600" y="524" text-anchor="middle" fill="#c09d6d"
        font-family="Helvetica, Arial, sans-serif" font-size="21" letter-spacing="7">LUXURY &amp; PREMIUM RUGS</text>
</svg>`;
await fs.writeFile('public/og-default.svg', og);
await sharp(Buffer.from(og), { density: 200 }).resize(1200, 630).png().toFile('public/og-default.png');
console.log('  public/og-default.svg + .png  (social cards need a raster image)');

// ---- Keep a raster copy of the original for anything that needs a bitmap
await sharp(SRC).png().toFile('public/brand/logo-original.png');
console.log('  public/brand/logo-original.png');

// ---- Apple touch icon: iOS ignores SVG favicons, so ship a raster too.
// Named apple-touch-icon (not apple-icon) because Next reserves the app-router
// metadata filenames icon.*/apple-icon.* and 404s same-named files in public/.
await sharp(Buffer.from(favicon), { density: 400 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('  public/apple-touch-icon.png');
