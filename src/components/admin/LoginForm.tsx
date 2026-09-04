'use client';

import { useActionState } from 'react';
import { login, type ActionState } from '@/app/admin/actions';

/**
 * `next` is passed down from the server page rather than read with
 * useSearchParams, so the form is present in the server-rendered HTML and works
 * before (and without) hydration. The email is restored from the action state
 * after a failed attempt, because React resets an uncontrolled form once its
 * action resolves.
 */
export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next && next.startsWith('/admin') ? next : '/admin'} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email" name="email" type="email" required autoComplete="username" className="input"
          defaultValue={state?.values?.email ?? ''}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
