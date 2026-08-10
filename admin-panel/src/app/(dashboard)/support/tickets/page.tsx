'use client';

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

export default function SupportTicketsPage() {
  return (
    <ResourcePage<TicketRow>
      title="تذاكر الدعم"
      description="تذاكر الدعم من المستخدمين"
      fetchPage={({ page, search, status, category }) =>
        fetchSupportTickets({ page, search, status, category, type: 'SUPPORT' })
      }
      filters={
        <div className="flex flex-wrap gap-2 text-sm">
          {['OPEN', 'IN_PROGRESS', 'AWAITING_USER', 'RESOLVED', 'CLOSED'].map((s) => (
            <span key={s} className="text-slate-500">{STATUS_LABEL[s]}</span>
          ))}
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
