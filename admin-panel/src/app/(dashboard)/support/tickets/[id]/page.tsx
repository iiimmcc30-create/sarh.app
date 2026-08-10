'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  fetchSupportTicket,
  fetchSupportStaff,
  replySupportTicket,
  updateSupportTicket,
} from '@/services/support.service';

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Record<string, unknown> | null>(null);
  const [staff, setStaff] = useState<Record<string, unknown>[]>([]);
  const [notes, setNotes] = useState('');
  const [reply, setReply] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    const [ticketRes, staffRes] = await Promise.all([
      fetchSupportTicket(id),
      fetchSupportStaff(),
    ]);
    setTicket(ticketRes.ticket);
    setStaff(staffRes.staff);
    setNotes(String(ticketRes.ticket.adminNotes ?? ''));
    setAssignedToId(String(ticketRes.ticket.assignedToId ?? ''));
    setStatus(String(ticketRes.ticket.status ?? 'OPEN'));
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (!ticket) return <p className="text-slate-400">جارٍ التحميل...</p>;

  const messages = (ticket.messages as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div>
      <PageHeader
        title={`تذكرة #${ticket.ticketNumber}`}
        description={String(ticket.subject)}
        actions={<Button variant="ghost" onClick={() => router.back()}>رجوع</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <p><Badge>{String(ticket.category)}</Badge></p>
          <p className="text-slate-300 whitespace-pre-wrap">{String(ticket.description)}</p>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={String(msg.id)}
                className={`rounded-xl p-3 ${msg.isStaffReply ? 'bg-emerald-950/40 border border-emerald-900/40' : 'bg-slate-950/60'}`}
              >
                <p className="text-xs text-slate-500 mb-1">{msg.isStaffReply ? 'فريق الدعم' : 'المستخدم'}</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{String(msg.body)}</p>
              </div>
            ))}
          </div>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="رد للمستخدم..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            rows={4}
          />
          <Button
            onClick={async () => {
              if (!reply.trim()) return;
              await replySupportTicket(id, { body: reply.trim() });
              setReply('');
              await load();
            }}
          >
            إرسال رد
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <label className="text-sm text-slate-400">الحالة</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
          >
            {['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'AWAITING_USER', 'RESOLVED', 'CLOSED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label className="text-sm text-slate-400">تعيين لموظف</label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
          >
            <option value="">—</option>
            {staff.map((s) => (
              <option key={String(s.id)} value={String(s.id)}>
                {String(s.arabicName || s.displayName || s.username)}
              </option>
            ))}
          </select>

          <label className="text-sm text-slate-400">ملاحظات داخلية</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            rows={5}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                await updateSupportTicket(id, {
                  status,
                  adminNotes: notes,
                  assignedToId: assignedToId || null,
                });
                await load();
              }}
            >
              حفظ
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await replySupportTicket(id, { body: notes, isInternal: true });
                await load();
              }}
            >
              إضافة ملاحظة داخلية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
