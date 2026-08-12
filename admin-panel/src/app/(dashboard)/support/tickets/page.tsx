'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ResourcePage, Badge } from '@/components/ui/ResourcePage';
import { Button } from '@/components/ui/Button';
import { fetchSupportTickets, updateSupportTicket } from '@/services/support.service';

type TicketRow = {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  createdAt: string;
};

const statusTone = (s: string) => {
  if (s === 'OPEN') return 'danger';
  if (s === 'AWAITING_USER') return 'warning';
  if (s === 'CLOSED' || s === 'RESOLVED') return 'success';
  return 'default';
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'جديدة',
  IN_REVIEW: 'قيد المراجعة',
  IN_PROGRESS: 'قيد المعالجة',
  AWAITING_USER: 'بانتظار المستخدم',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة',
};

const FILTER_STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'AWAITING_USER', 'RESOLVED', 'CLOSED'] as const;

export default function SupportTicketsPage() {
  const [status, setStatus] = useState('');

  const fetchPage = useCallback(
    ({ page, search, category }: { page: number; search: string; category?: string }) =>
      fetchSupportTickets({
        page,
        search,
        category,
        status: status || undefined,
        type: 'SUPPORT',
      }),
    [status],
  );

  return (
    <ResourcePage<TicketRow>
      title="تذاكر الدعم"
      description="تذاكر الدعم من المستخدمين"
      fetchPage={fetchPage}
      status={status || undefined}
      filters={
        <div className="flex flex-wrap gap-2 text-sm">
          {FILTER_STATUSES.map((s) => {
            const active = status === s;
            const label = s ? STATUS_LABEL[s] : 'الكل';
            return (
              <button
                key={s || 'all'}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 border border-slate-700 hover:border-slate-500'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      }
      columns={[
        { key: 'ticketNumber', label: 'الرقم' },
        { key: 'subject', label: 'الموضوع' },
        { key: 'category', label: 'التصنيف' },
        {
          key: 'status',
          label: 'الحالة',
          render: (r) => (
            <Badge tone={statusTone(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
          ),
        },
      ]}
      actions={(row, reload) => (
        <div className="flex gap-2">
          <Link href={`/support/tickets/${row.id}`}>
            <Button variant="ghost" size="sm">عرض</Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await updateSupportTicket(row.id, { status: 'IN_PROGRESS' });
              reload();
            }}
          >
            معالجة
          </Button>
        </div>
      )}
    />
  );
}
