import Link from 'next/link';
import { CartProvider } from '@/components/CartProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <CartProvider>
      <Header />
      <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-display text-5xl">This page has unravelled</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/60">
          The page you are looking for has moved or never existed. Our rugs, however, are all still here.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/rugs" className="btn-primary">Browse rugs</Link>
          <Link href="/" className="btn-outline">Go home</Link>
        </div>
      </main>
      <Footer />
    </CartProvider>
  );
}
