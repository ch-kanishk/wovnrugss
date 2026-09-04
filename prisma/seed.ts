import { readFileSync, existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';

/**
 * tsx does not read .env, and Prisma Client reads DATABASE_URL from the process
 * environment — so without this, `npm run db:seed` fails on a machine that keeps
 * its connection string in .env rather than exporting it. Real environment
 * variables take precedence, so `DATABASE_URL=... npm run db:seed` still works
 * for seeding a remote database.
 */
function loadEnvFiles() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      const quoted = rawValue.trim().match(/^(['"])([\s\S]*)\1/);
      process.env[key] = quoted ? quoted[2] : rawValue.split('#')[0].trim();
    }
  }
}
loadEnvFiles();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. See .env.example.');
  process.exit(1);
}

const prisma = new PrismaClient();

const U = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

const RUG_IMAGES = [
  U('1600166898405-da9535204843'), U('1615873968403-89e068629265'),
  U('1584285405429-136bf988919c'), U('1567016432779-094069958ea5'),
  U('1600607687920-4e2a09cf159d'), U('1616486338812-3dadae4b4ace'),
  U('1618221195710-dd6b41faaea6'), U('1493663284031-b7e3aefcae8e'),
];

const CATEGORIES = [
  {
    name: 'Hand-Knotted', slug: 'hand-knotted', sortOrder: 1,
    description:
      'Woven knot by knot on a vertical loom, a hand-knotted rug is the most durable carpet you can own. Ours run from 120 to 400 knots per square inch and take six to twelve months to complete.',
    heroImage: U('1600166898405-da9535204843', 1600),
    metaTitle: 'Hand-Knotted Rugs — Wool & Silk Carpets from Jaipur',
    metaDescription: 'Shop hand-knotted wool and silk rugs made on traditional looms in Jaipur. 120–400 KPSI, custom sizes, worldwide shipping.',
  },
  {
    name: 'Hand-Tufted', slug: 'hand-tufted', sortOrder: 2,
    description:
      'Made with a tufting tool on a stretched canvas, hand-tufted rugs give you plush, dense pile and bold design at a gentler price than knotted work.',
    heroImage: U('1600607687920-4e2a09cf159d', 1600),
    metaTitle: 'Hand-Tufted Rugs — Plush Wool Area Rugs',
    metaDescription: 'Hand-tufted wool area rugs in modern and transitional designs. Dense pile, fast lead times, made in Jaipur.',
  },
  {
    name: 'Flatweave & Dhurrie', slug: 'flatweave', sortOrder: 3,
    description:
      'No pile, reversible, and light enough to move on your own — flatweave dhurries are the everyday workhorse of Indian floor covering, woven flat on a pit loom.',
    heroImage: U('1567016432779-094069958ea5', 1600),
    metaTitle: 'Flatweave Rugs & Cotton Dhurries',
    metaDescription: 'Reversible flatweave dhurries in wool, cotton and jute. Lightweight, washable, handmade in Rajasthan.',
  },
  {
    name: 'Runners', slug: 'runners', sortOrder: 4,
    description:
      'Long, narrow rugs for hallways, kitchens and the side of a bed. Available hand-knotted or flatwoven, and weavable to any length you need.',
    heroImage: U('1616486338812-3dadae4b4ace', 1600),
    metaTitle: 'Rug Runners for Hallways & Kitchens',
    metaDescription: 'Handmade wool runners for hallways, kitchens and bedsides. Custom lengths woven to order in Jaipur.',
  },
];

const PRODUCTS = [
  { name: 'Amrapali Hand-Knotted Wool Rug', sku: 'WR-HK-1001', category: 'hand-knotted', price: 84000, compareAt: 98000,
    technique: 'Hand-Knotted', material: 'Wool', style: 'Traditional', colorFamily: 'Ivory', shape: 'Rectangle',
    sizeLabel: "8' x 10'", widthCm: 244, lengthCm: 305, pileHeight: '10 mm', knotsPerSqIn: 200, stock: 3, featured: true,
    shortDesc: 'A softened Mughal medallion in undyed ivory and madder, hand-knotted at 200 KPSI.',
    description: 'The Amrapali reworks a 17th-century Mughal medallion at a scale that suits a modern living room. Hand-knotted in Bikaneri wool at 200 knots per square inch, then hand-clipped so the border carving sits proud of the field. Nine months on the loom for the 8×10.' },
  { name: 'Ranthambore Silk-Blend Carpet', sku: 'WR-HK-1002', category: 'hand-knotted', price: 168000, compareAt: 195000,
    technique: 'Hand-Knotted', material: 'Wool & Silk', style: 'Traditional', colorFamily: 'Blue', shape: 'Rectangle',
    sizeLabel: "9' x 12'", widthCm: 274, lengthCm: 366, pileHeight: '8 mm', knotsPerSqIn: 300, stock: 1, featured: true,
    shortDesc: 'Indigo field with a silk-highlighted vine border, 300 knots per square inch.',
    description: 'Our finest weave. A deep indigo ground carries a scrolling vine picked out in Chinese silk, which catches light differently as you cross the room. At 300 KPSI this carpet holds roughly 3.9 million knots and took four weavers eleven months.' },
  { name: 'Jaisalmer Sand Flatweave Dhurrie', sku: 'WR-FW-2001', category: 'flatweave', price: 18500, compareAt: 24000,
    technique: 'Flatweave', material: 'Wool', style: 'Geometric', colorFamily: 'Beige', shape: 'Rectangle',
    sizeLabel: "6' x 9'", widthCm: 183, lengthCm: 274, pileHeight: '4 mm', stock: 12, featured: true,
    shortDesc: 'Reversible wool dhurrie in sand and chalk, woven flat on a pit loom.',
    description: 'A flat, reversible dhurrie in two natural wool tones. No pile means no shedding and easy cleaning — it is the rug we put in our own kitchens. Flip it every season to even out the wear.' },
  { name: 'Aravalli Charcoal Hand-Tufted Rug', sku: 'WR-HT-3001', category: 'hand-tufted', price: 32000, compareAt: 41000,
    technique: 'Hand-Tufted', material: 'Wool & Viscose', style: 'Modern', colorFamily: 'Charcoal', shape: 'Rectangle',
    sizeLabel: "5' x 8'", widthCm: 152, lengthCm: 244, pileHeight: '13 mm', stock: 7, featured: true,
    shortDesc: 'A soft charcoal field broken by a viscose ridge line, plush 13 mm pile.',
    description: 'Dense, plush and quiet underfoot. Wool gives the body, a viscose highlight traces a single ridge across the field for a subtle shift in sheen. Ideal under a coffee table.' },
  { name: 'Bagru Block-Print Cotton Dhurrie', sku: 'WR-FW-2002', category: 'flatweave', price: 9800, compareAt: 13500,
    technique: 'Flatweave', material: 'Cotton', style: 'Traditional', colorFamily: 'Blue', shape: 'Rectangle',
    sizeLabel: "4' x 6'", widthCm: 122, lengthCm: 183, pileHeight: '3 mm', stock: 20,
    shortDesc: 'Washable cotton dhurrie printed with hand-carved Bagru blocks.',
    description: 'Woven in cotton, then printed by hand with wooden blocks carved in Bagru village outside Jaipur. Machine washable on a cold, gentle cycle — the natural indigo softens beautifully with age.' },
  { name: 'Chittor Rust Medallion Rug', sku: 'WR-HK-1003', category: 'hand-knotted', price: 64000,
    technique: 'Hand-Knotted', material: 'Wool', style: 'Transitional', colorFamily: 'Rust', shape: 'Rectangle',
    sizeLabel: "6' x 9'", widthCm: 183, lengthCm: 274, pileHeight: '10 mm', knotsPerSqIn: 160, stock: 4,
    shortDesc: 'A faded medallion in madder rust and stone, with an abrash-washed ground.',
    description: 'The pattern is traditional, the wash is not — we over-wash this rug to pull the rust back to a soft terracotta, so it reads as an heirloom rather than a new purchase.' },
  { name: 'Udaipur Ivory Runner', sku: 'WR-RN-4001', category: 'runners', price: 22000, compareAt: 28000,
    technique: 'Hand-Knotted', material: 'Wool', style: 'Traditional', colorFamily: 'Ivory', shape: 'Runner',
    sizeLabel: "2'6\" x 10'", widthCm: 76, lengthCm: 305, pileHeight: '9 mm', knotsPerSqIn: 160, stock: 6, featured: true,
    shortDesc: 'A narrow hall runner with a repeating boteh in ivory and soft grey.',
    description: 'Made for a hallway that takes daily traffic. Tight 160 KPSI weave, a low pile that will not catch a door, and a boteh repeat that carries the eye down the corridor. Available in any length to order.' },
  { name: 'Marwar Green Geometric Rug', sku: 'WR-HT-3002', category: 'hand-tufted', price: 28500,
    technique: 'Hand-Tufted', material: 'Wool', style: 'Geometric', colorFamily: 'Green', shape: 'Rectangle',
    sizeLabel: "5' x 7'", widthCm: 152, lengthCm: 213, pileHeight: '12 mm', stock: 9,
    shortDesc: 'Interlocking diamonds in sage and cream, carved along every edge.',
    description: 'A modern geometric with hand-carved outlines that give the pattern real depth. The sage reads as a neutral in most rooms while adding more warmth than a grey.' },
  { name: 'Pushkar Round Jute Rug', sku: 'WR-FW-2003', category: 'flatweave', price: 12500,
    technique: 'Hand-Braided', material: 'Jute', style: 'Modern', colorFamily: 'Beige', shape: 'Round',
    sizeLabel: "6' diameter", widthCm: 183, lengthCm: 183, pileHeight: '8 mm', stock: 14,
    shortDesc: 'Hand-braided jute in a concentric spiral, 6 ft across.',
    description: 'Braided from raw jute in a single spiral. Hard-wearing and honest — this is the rug for a sunroom, a reading corner, or under a round dining table.' },
  { name: 'Nagaur Gold Silk Accent Rug', sku: 'WR-HK-1004', category: 'hand-knotted', price: 96000, compareAt: 118000,
    technique: 'Hand-Knotted', material: 'Pure Silk', style: 'Traditional', colorFamily: 'Gold', shape: 'Rectangle',
    sizeLabel: "3' x 5'", widthCm: 91, lengthCm: 152, pileHeight: '5 mm', knotsPerSqIn: 400, stock: 2,
    shortDesc: 'Pure silk at 400 KPSI — an accent piece with the detail of a miniature painting.',
    description: 'At 400 knots per square inch the design resolves like a Mughal miniature. Pure Bengal silk, so it changes tone completely depending on which direction you view it from. Best as a wall hanging or a low-traffic accent.' },
  { name: 'Shekhawati Grey Abstract Rug', sku: 'WR-HT-3003', category: 'hand-tufted', price: 38000,
    technique: 'Hand-Tufted', material: 'Wool & Viscose', style: 'Abstract', colorFamily: 'Grey', shape: 'Rectangle',
    sizeLabel: "8' x 10'", widthCm: 244, lengthCm: 305, pileHeight: '14 mm', stock: 5,
    shortDesc: 'Loose brushstroke abstraction in six greys, high-low pile.',
    description: 'Drawn from a watercolour study of monsoon sky. Cut and loop pile at two heights make the brushstrokes legible underfoot as well as by eye.' },
  { name: 'Bikaner Natural Wool Runner', sku: 'WR-RN-4002', category: 'runners', price: 16500,
    technique: 'Flatweave', material: 'Wool', style: 'Modern', colorFamily: 'Ivory', shape: 'Runner',
    sizeLabel: "2'6\" x 8'", widthCm: 76, lengthCm: 244, pileHeight: '5 mm', stock: 11,
    shortDesc: 'Undyed Bikaneri wool in its three natural shades, flatwoven.',
    description: 'No dye at all — the stripes are the natural colours of the fleece, sorted by hand. A rug that gets softer and slightly paler with every year of use.' },
];

const POSTS = [
  {
    title: 'What size rug do you actually need? A room-by-room guide',
    slug: 'what-size-rug-do-you-need',
    excerpt: 'The single most common mistake in rug buying is going too small. Here is how to size a rug for a living room, dining room, bedroom and hallway — with the measurements that matter.',
    tags: 'sizing, styling, buying guide',
    coverImage: U('1600607687920-4e2a09cf159d', 1600),
    content: `Nearly every rug we take back was simply too small for its room. A rug that floats in the middle of the floor makes a space look smaller, not larger. Here is how to get it right the first time.

## Living rooms
The rule that matters: **all front legs of your seating should sit on the rug**. That is the minimum. Better still, put every leg on it.

- Small living room: 5' × 8' with front legs on
- Standard living room: 8' × 10' — the size that suits most Indian and European sitting rooms
- Large or open-plan: 9' × 12' or larger, with the whole seating group on the rug

Leave 45–60 cm of bare floor between the rug edge and the wall. That border is what makes a room look finished.

## Dining rooms
Measure the table, then add **60 cm on every side**. That is the distance a chair travels when someone pushes back to stand. If a chair leg drops off the edge, the rug is too small.

- 4-seat table: 6' × 9'
- 6-seat table: 8' × 10'
- 8-seat table: 9' × 12'

For a round table, a round rug 60 cm wider all round looks best.

## Bedrooms
Three options that work:

- One large rug under the whole bed, extending 60–75 cm past the sides and foot
- Two runners, one either side of the bed
- One rug placed under the lower two-thirds of the bed, so it appears at the foot and sides

Avoid a small rug at the foot of the bed on its own — it reads as an afterthought.

## Hallways and kitchens
Runners should stop **20–25 cm short of the wall at each end**, and leave 10 cm of floor visible along each side. In a galley kitchen, a runner that reaches the full length of the working area is more comfortable than two small mats.

## Still unsure?
Mark the size out on your floor with masking tape and live with it for a day. It costs nothing and it settles the question. If the size you need is not standard, [we weave to order](/contact?topic=custom) at no extra cost per square foot.`,
  },
  {
    title: 'How to care for a hand-knotted wool rug',
    slug: 'how-to-care-for-a-wool-rug',
    excerpt: 'A well-made wool rug should outlive you. Here is the maintenance routine that gets it there — vacuuming, rotating, spills, moths and professional washing.',
    tags: 'rug care, wool, maintenance',
    coverImage: U('1615873968403-89e068629265', 1600),
    content: `Wool is remarkably forgiving. It has a natural lanolin coat that resists dirt and liquid, it hides soil well, and it recovers from crushing. Most of what shortens a rug's life is avoidable.

## Weekly
Vacuum in the direction of the pile, **with the beater bar switched off or lifted**. A rotating brush pulls at hand-knotted pile and, over years, opens up the knots. Suction alone is enough.

Never vacuum the fringe. Comb it straight by hand instead.

## Every six months
Rotate the rug 180°. Sun and footfall both fade and flatten unevenly, and a rotation twice a year keeps the wear even across the whole surface.

## Spills
Act within minutes and you will almost never have a stain.

- Blot, do not rub — rubbing drives the spill into the foundation
- Work from the outside of the spill inwards
- Use plain cold water and a white cloth; coloured cloths transfer dye
- For wine or coffee, blot with cold water, then a drop of clear dish soap in water, then plain water again
- Dry with the pile lifted, and use a fan — a damp foundation is what causes mildew

Do not use hot water, bleach, or a steam cleaner on a hand-knotted rug.

## Moths
Moths eat wool, particularly in the dark, undisturbed parts of a rug — under a sofa, under a bed. Vacuuming under furniture every few months is genuinely the whole prevention strategy. If you are storing a rug, roll it (never fold it) around a tube, wrap it in breathable cotton, not plastic, and add cedar.

## Professional washing
Every two to three years, have the rug washed by someone who handles hand-knotted work — not a general carpet-cleaning service. A proper wash immerses the rug, restores the lanolin and takes out the soil that vacuuming cannot reach.

## Underlay
Always use one. A good felt-and-rubber underlay stops the rug creeping, adds a great deal to how it feels underfoot, and — most importantly — absorbs the abrasion that would otherwise grind the foundation against the floor.`,
  },
  {
    title: 'Hand-knotted vs hand-tufted: what you are actually paying for',
    slug: 'hand-knotted-vs-hand-tufted',
    excerpt: 'Both are handmade. They are made in completely different ways, last for different lengths of time, and cost very different amounts. Here is the honest comparison.',
    tags: 'buying guide, craft, hand-knotted',
    coverImage: U('1584285405429-136bf988919c', 1600),
    content: `"Handmade" covers two very different objects. Knowing which one you are buying is the single most useful thing when comparing prices.

## Hand-knotted
Each tuft of wool is tied individually around warp threads on a vertical loom. There is no backing glue and no adhesive of any kind — the rug is held together by its own structure.

- **Time:** six to twelve months for an 8×10
- **Life:** 30 to 100 years, and it can be repaired and rewoven
- **Tell:** flip it over. The pattern is fully visible on the back, and you can count individual knots
- **Price:** the highest, because you are buying months of one person's labour

## Hand-tufted
Wool is punched through a stretched canvas with a hand-held tufting gun, then a scrim backing is glued on and a cloth backing is stitched over it.

- **Time:** a few days to two weeks
- **Life:** 7 to 15 years with normal use; the latex backing eventually dries and crumbles
- **Tell:** flip it over. You see a plain cloth backing, not the pattern
- **Price:** roughly a quarter to a third of knotted work at the same size

## Which should you buy?
Buy hand-tufted if you want a specific bold design, you are furnishing a room you might redo in a decade, or the budget is the deciding factor. It is a genuinely handmade object and it will look excellent.

Buy hand-knotted if you want the rug to outlive the room it is in. The cost per year of use is usually *lower*, not higher — a ₹84,000 knotted rug over 40 years costs less annually than a ₹32,000 tufted rug replaced three times.

## What about flatweave?
A third category entirely: no pile, woven flat, reversible, and generally the least expensive. Excellent in kitchens, sunrooms and layered under a larger pile rug. It will not give you the plushness of either of the above.

Browse [hand-knotted](/collections/hand-knotted), [hand-tufted](/collections/hand-tufted) or [flatweave](/collections/flatweave) to compare in person.`,
  },
  {
    title: 'Inside the Jaipur loom: how a carpet is really made',
    slug: 'inside-the-jaipur-loom',
    excerpt: 'From a hand-painted graph to the final clipping — a walk through the nine months it takes to make one hand-knotted carpet in Rajasthan.',
    tags: 'craft, jaipur, behind the scenes',
    coverImage: U('1618221195710-dd6b41faaea6', 1600),
    content: `We are asked often why a rug takes nine months. This is what happens in those months.

## The graph
Every design begins on paper as a grid where one square equals one knot. An 8×10 rug at 200 knots per square inch means about 2.3 million squares. A designer paints this by hand, choosing each colour against dyed wool samples rather than a screen.

## Talim
The graph is translated into *talim* — a coded shorthand written in Devanagari that tells the weaver the colour and count of every row. A master weaver chants the talim aloud while the family at the loom ties knots to it. It is closer to reading music than reading instructions.

## Dyeing
Wool arrives from Bikaner, is scoured, then dyed in small batches in copper vats. Small batches mean slight variation between them — this is *abrash*, the subtle horizontal banding you see in good rugs. It is a mark of hand-dyeing, not a fault.

The dyed skeins go up on the roof to cure in the sun for several days.

## Weaving
Two to four weavers sit shoulder to shoulder at a vertical loom. Each ties a knot, cuts the yarn, and moves on — thousands of times a day. After every row they beat the row down with an iron comb and trim the pile roughly level.

A skilled weaver ties around 8,000 to 10,000 knots a day. At 2.3 million knots, the arithmetic gives you the nine months.

## Finishing
Off the loom, the rug is:

- **Washed** — several immersions to remove dye residue and open the wool
- **Stretched** — pinned flat on a frame to dry perfectly square
- **Clipped** — the pile shaved by hand to an even height
- **Carved** — outlines cut into the pile so motifs stand out
- **Inspected** — every square foot checked, then bound and dispatched

## Why this matters when you buy
When you compare two rugs that look similar, you are usually comparing knot density, wool quality and finishing time. Those three things are where the months — and the price — go.

Come and see for yourself: our studio in Sitapura is open to visitors, and our looms are open to inspection.`,
  },
];

async function main() {
  console.log('Seeding Wovn Rugs…');

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.post.deleteMany();

  const categoryIds: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({ data: cat });
    categoryIds[cat.slug] = created.id;
  }
  console.log(`  ${CATEGORIES.length} collections`);

  for (const [i, p] of PRODUCTS.entries()) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug,
        shortDesc: p.shortDesc,
        description: p.description,
        price: p.price * 100,
        compareAt: p.compareAt ? p.compareAt * 100 : null,
        stock: p.stock,
        isFeatured: Boolean(p.featured),
        categoryId: categoryIds[p.category],
        material: p.material,
        technique: p.technique,
        style: p.style,
        colorFamily: p.colorFamily,
        shape: p.shape,
        sizeLabel: p.sizeLabel,
        widthCm: p.widthCm,
        lengthCm: p.lengthCm,
        pileHeight: p.pileHeight,
        knotsPerSqIn: p.knotsPerSqIn ?? null,
        images: {
          create: [
            { url: RUG_IMAGES[i % RUG_IMAGES.length], alt: p.name, sortOrder: 0 },
            { url: RUG_IMAGES[(i + 3) % RUG_IMAGES.length], alt: `${p.name} — detail`, sortOrder: 1 },
            { url: RUG_IMAGES[(i + 5) % RUG_IMAGES.length], alt: `${p.name} — in situ`, sortOrder: 2 },
          ],
        },
      },
    });
  }
  console.log(`  ${PRODUCTS.length} products`);

  for (const [i, post] of POSTS.entries()) {
    await prisma.post.create({
      data: {
        ...post,
        isPublished: true,
        publishedAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000),
        metaDescription: post.excerpt.slice(0, 158),
      },
    });
  }
  console.log(`  ${POSTS.length} blog posts`);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
