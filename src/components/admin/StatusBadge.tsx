import { cn } from '@/lib/utils';

const TONES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-emerald-100 text-emerald-900',
  CANCELLED: 'bg-ink/10 text-ink/60',
  REFUNDED: 'bg-purple-100 text-purple-800',
  FAILED: 'bg-red-100 text-red-800',
  UNPAID: 'bg-amber-100 text-amber-800',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn('badge', TONES[status] ?? 'bg-ink/10 text-ink/70')}>{status}</span>;
}
