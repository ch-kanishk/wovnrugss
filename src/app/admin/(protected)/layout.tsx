import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { AdminNav } from '@/components/admin/AdminNav';
import { Logo } from '@/components/Logo';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defence in depth: middleware already verified the cookie signature.
  const session = await getSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-3">
              <Logo variant="mark" height={30} className="h-[30px] w-auto" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-700">Admin</span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" target="_blank" className="text-ink/55 hover:text-ink">View store ↗</Link>
            <span className="text-ink/40">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-6 py-8">{children}</div>
    </div>
  );
}
