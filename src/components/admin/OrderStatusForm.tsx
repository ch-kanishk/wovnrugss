'use client';

import { useActionState } from 'react';
import { updateOrder, type ActionState } from '@/app/admin/actions';

const STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED'];
const CARRIERS = ['DHL', 'FedEx', 'Blue Dart', 'Delhivery', 'India Post', 'Aramex'];

export function OrderStatusForm({
  order,
}: {
  order: { id: string; status: string; trackingNumber: string | null; carrier: string | null; notes: string | null };
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateOrder, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={order.id} />

      <div>
        <label htmlFor="status" className="label">Order status</label>
        <select id="status" name="status" defaultValue={order.status} className="input">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="carrier" className="label">Carrier</label>
        <input id="carrier" name="carrier" list="carriers" defaultValue={order.carrier ?? ''} className="input" />
        <datalist id="carriers">{CARRIERS.map((c) => <option key={c} value={c} />)}</datalist>
      </div>

      <div>
        <label htmlFor="trackingNumber" className="label">Tracking number</label>
        <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ''} className="input font-mono text-xs" />
      </div>

      <div>
        <label htmlFor="notes" className="label">Internal notes</label>
        <textarea id="notes" name="notes" rows={4} defaultValue={order.notes ?? ''} className="input" />
      </div>

      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full py-2.5 text-xs">
        {pending ? 'Saving…' : 'Update order'}
      </button>
    </form>
  );
}
