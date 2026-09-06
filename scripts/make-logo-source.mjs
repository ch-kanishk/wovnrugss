/**
 * Regenerate assets/logo-source.png for the Bonanza Rugs brand.
 *
 * The brand SVGs in public/brand are potrace *tracings* of this bitmap, so the
 * lettering cannot be edited after the fact — a rename means redrawing the
 * source. This script lays out the three content bands at exactly the offsets
 * gen-brand.mjs slices out (see BOX there), so the derived assets and the
 * aspect ratios hard-coded in src/components/Logo.tsx stay valid:
 *
 *   monogram  46,112  384x202
 *   wordmark  153,337 192x24
 *   tagline   below, inside the 384x316 "full" band
 *
 * Each element is rendered on its own, trimmed to its ink bounds and then
 * placed, so the result does not depend on font metrics guessed in advance.
 *
 * The canvas is drawn at SCALE x the 500x500 layout above. The original artwork
 * was a 500px photo-like bitmap whose heavy Didone strokes traced cleanly at
 * that size; generated text is much thinner, and the 21-character tagline ends
 * up ~15px tall at 1x, which potrace renders as mush. gen-brand.mjs shares the
 * same SCALE so its slice boxes stay aligned.
 *
 * Replace assets/logo-source.png with real artwork and re-run `npm run brand`
 * to skip this step entirely.
 */
import { promises as fs } from 'fs';
import sharp from 'sharp';

// Keep in step with SCALE in gen-brand.mjs.
const SCALE = 4;
const box = (left, top, width, height) => ({
  left: left * SCALE, top: top * SCALE, width: width * SCALE, height: height * SCALE,
});

const SERIF = 'Liberation Serif, DejaVu Serif, FreeSerif, serif';
const SANS = 'Liberation Sans, DejaVu Sans, sans-serif';

/** Render one line of text and trim it to the pixels actually inked. */
async function ink(markup, w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${markup}</svg>`;
  return sharp(Buffer.from(svg), { density: 300 })
    .png()
    .toBuffer()
    .then((buf) => sharp(buf).trim({ threshold: 1 }).png().toBuffer());
}

/** Scale a trimmed element to fit inside box, preserving aspect, and centre it. */
async function place(buffer, box) {
  const meta = await sharp(buffer).metadata();
  const scale = Math.min(box.width / meta.width, box.height / meta.height);
  const w = Math.max(1, Math.round(meta.width * scale));
  const h = Math.max(1, Math.round(meta.height * scale));
  return {
    input: await sharp(buffer).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer(),
    left: box.left + Math.round((box.width - w) / 2),
    top: box.top + Math.round((box.height - h) / 2),
  };
}

// ---- Monogram: interlocking B and R, the way the old WR overlapped ----------
// Drawn as two glyphs with a negative gap so they read as one mark rather than
// two initials sitting side by side.
const monogram = await ink(
  `<g font-family="${SERIF}" font-weight="bold" fill="#000">
     <text x="20"  y="300" font-size="330">B</text>
     <text x="215" y="300" font-size="330">R</text>
   </g>`,
  520,
  360
);

// ---- Wordmark: letterspaced caps, as "WOVN RUGS" was -----------------------
const wordmark = await ink(
  `<text x="10" y="60" font-family="${SANS}" font-size="52" letter-spacing="13"
         fill="#000">BONANZA RUGS</text>`,
  900,
  90
);

// ---- Tagline ---------------------------------------------------------------
const tagline = await ink(
  `<text x="10" y="60" font-family="${SERIF}" font-weight="bold" font-size="46"
         letter-spacing="1" fill="#000">LUXURY &amp; PREMIUM RUGS</text>`,
  900,
  90
);

const layers = await Promise.all([
  place(monogram, box(46, 112, 384, 202)),
  place(wordmark, box(153, 337, 192, 24)),
  place(tagline, box(88, 390, 300, 24)),
]);

await sharp({
  create: { width: 500 * SCALE, height: 500 * SCALE, channels: 3, background: '#ffffff' },
})
  .composite(layers)
  .png()
  .toFile('assets/logo-source.png');

console.log(`assets/logo-source.png rebuilt (${500 * SCALE}x${500 * SCALE})`);
for (const [i, name] of ['monogram', 'wordmark', 'tagline'].entries()) {
  console.log(`  ${name} placed at ${layers[i].left},${layers[i].top}`);
}
await fs.access('assets/logo-source.png');
