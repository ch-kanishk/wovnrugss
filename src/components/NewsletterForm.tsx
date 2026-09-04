'use client';

import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setState('done');
      setMessage('Thank you — check your inbox for a welcome note.');
      setEmail('');
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm">
      <label htmlFor="newsletter-email" className="label">Join the atelier list</label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
        />
        <button type="submit" disabled={state === 'loading'} className="btn-primary whitespace-nowrap px-4">
          {state === 'loading' ? '…' : 'Join'}
        </button>
      </div>
      {message && (
        <p role="status" className={`mt-2 text-xs ${state === 'error' ? 'text-red-600' : 'text-brand-700'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
