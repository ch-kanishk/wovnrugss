import Image from 'next/image';
import { site } from '@/lib/config';

type Variant = 'lockup' | 'lockup-h' | 'mark' | 'full';

const SRC: Record<Variant, { dark: string; light: string; ratio: number }> = {
  // ratio = width / height of the source artwork
  mark:   { dark: '/brand/mark.svg',   light: '/brand/mark-light.svg',   ratio: 384 / 202 },
  lockup: { dark: '/brand/lockup.svg', light: '/brand/lockup-light.svg', ratio: 384 / 249 },
  // Horizontal recomposition of the same artwork, for headers and other short bars
  'lockup-h': { dark: '/brand/lockup-h.svg', light: '/brand/lockup-h-light.svg', ratio: 1732 / 404 },
  full:   { dark: '/brand/logo.svg',   light: '/brand/logo.svg',         ratio: 384 / 316 },
};

/**
 * The Wovn Rugs logo. `height` drives the size; width follows the artwork ratio.
 * `tone="light"` swaps to the white artwork for dark backgrounds.
 * Rendered unoptimized because it is already an SVG — nothing for the image
 * optimizer to do, and it avoids needing dangerouslyAllowSVG.
 */
export function Logo({
  variant = 'lockup',
  height = 52,
  tone = 'dark',
  priority = false,
  className,
}: {
  variant?: Variant;
  height?: number;
  tone?: 'dark' | 'light';
  priority?: boolean;
  className?: string;
}) {
  const art = SRC[variant];
  return (
    <Image
      src={tone === 'light' ? art.light : art.dark}
      alt={`${site.name} — ${site.tagline}`}
      width={Math.round(height * art.ratio)}
      height={height}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}
