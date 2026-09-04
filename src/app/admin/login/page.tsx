import { LoginForm } from '@/components/admin/LoginForm';
import { Logo } from '@/components/Logo';

export const metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm border border-ink/10 bg-white p-9">
        <div className="mb-8 flex flex-col items-center">
          <Logo variant="lockup" height={78} priority className="h-[78px] w-auto" />
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-brand-700">Admin</p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
