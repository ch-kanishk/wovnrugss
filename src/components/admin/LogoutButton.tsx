'use client';

import { logout } from '@/app/admin/actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="text-ink/55 underline underline-offset-4 hover:text-ink">
        Sign out
      </button>
    </form>
  );
}
