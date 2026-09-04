'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="font-display text-4xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-sm text-ink/60">
        We hit an unexpected error. Try again, and if it persists please contact the studio.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-8">Try again</button>
    </div>
  );
}
