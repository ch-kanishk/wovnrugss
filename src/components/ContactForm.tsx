'use client';

import { useState } from 'react';

const TOPICS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'custom', label: 'Custom size or colour' },
  { value: 'order', label: 'An existing order' },
  { value: 'trade', label: 'Trade / interior designer' },
  { value: 'press', label: 'Press' },
];

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send your message.');
      setState('done');
      setMessage('Thank you — we have your message and will reply within two working days.');
      e.currentTarget.reset();
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Could not send your message.');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex h-full items-center justify-center border border-ink/10 p-10 text-center">
        <div>
          <p className="font-display text-2xl">Message sent</p>
          <p className="mt-3 text-sm text-ink/60">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 border border-ink/10 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" required autoComplete="name" className="input" />
        </div>
        <div>
          <label htmlFor="c-email" className="label">Email</label>
          <input id="c-email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="c-phone" className="label">Phone (optional)</label>
          <input id="c-phone" name="phone" type="tel" autoComplete="tel" className="input" />
        </div>
        <div>
          <label htmlFor="subject" className="label">Topic</label>
          <select id="subject" name="subject" defaultValue={defaultTopic ?? 'general'} className="input">
            {TOPICS.map((t) => <option key={t.value} value={t.label}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="c-message" className="label">Message</label>
        <textarea id="c-message" name="message" rows={6} required minLength={10} className="input" placeholder="Tell us the size, colours or room you have in mind…" />
      </div>

      {/* Honeypot — bots fill this, humans never see it. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {state === 'error' && <p role="alert" className="text-sm text-red-600">{message}</p>}

      <button type="submit" disabled={state === 'loading'} className="btn-primary w-full">
        {state === 'loading' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
