'use client';

import Link from 'next/link';
import { ResourcePage, Badge } from '@/components/ui/ResourcePage';
import { Button } from '@/components/ui/Button';
import { fetchVerificationRequests } from '@/services/support.service';

type Row = {
  id: string;
  status: string;
  fullName?: string;
  nationalId?: string;
  submittedAt?: string;
  user?: { arabicName?: string; username?: string };
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'لم يُرسل',
  UNDER_REVIEW: 'قيد المراجعة',
  NEEDS_AMENDMENTS: 'يحتاج تعديلات',
  VERIFIED: 'موثق',
  REJECTED: 'مرفوض',
};

export default function VerificationRequestsPage() {
  return (
    <ResourcePage<Row>
      title="طلبات توثيق الحساب"
      description="مراجعة وقبول أو رفض طلبات التوثيق"
      fetchPage={({ page, search, status }) =>
        fetchVerificationRequests({ page, search, status })
      }
      columns={[
        {
          key: 'user',
          label: 'المستخدم',
          render: (r) => r.user?.arabicName || r.user?.username || '—',
        },
        { key: 'fullName', label: 'الاسم' },
        { key: 'nationalId', label: 'الهوية' },
        {
          key: 'status',
          label: 'الحالة',
          render: (r) => (
            <Badge tone={r.status === 'VERIFIED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}>
              {STATUS_LABEL[r.status] ?? r.status}
            </Badge>
          ),
        },
      ]}
      actions={(row) => (
        <Link href={`/support/verification/${row.id}`}>
          <Button variant="ghost" size="sm">مراجعة</Button>
        </Link>
      )}
    />
  );
}
