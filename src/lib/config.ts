export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Wovn Rugs',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  tagline: 'Luxury & Premium Rugs',
  description:
    'Wovn Rugs crafts hand-knotted and hand-tufted wool and silk rugs in Jaipur, India. Shop traditional, modern and transitional area rugs with worldwide shipping.',
  email: 'care@wovnrugs.com',
  phone: '+91 141 000 0000',
  whatsapp: '+919000000000',
  address: {
    street: 'Sitapura Industrial Area',
    city: 'Jaipur',
    region: 'Rajasthan',
    postalCode: '302022',
    country: 'IN',
  },
  social: {
    instagram: 'https://instagram.com/wovnrugs',
    facebook: 'https://facebook.com/wovnrugs',
    pinterest: 'https://pinterest.com/wovnrugs',
  },
  defaultOgImage: '/og-default.png', // social cards must be raster
};

export const store = {
  currency: process.env.STORE_CURRENCY || 'INR',
  freeShippingAbove: Number(process.env.FREE_SHIPPING_ABOVE || 15000) * 100, // paise
  flatShippingFee: Number(process.env.FLAT_SHIPPING_FEE || 499) * 100, // paise
  gstPercent: Number(process.env.GST_PERCENT || 12),
};
