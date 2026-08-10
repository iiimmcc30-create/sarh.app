'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fetchVerificationRequest, updateVerificationRequest } from '@/services/support.service';

export default function VerificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const load = async () => {
    const res = await fetchVerificationRequest(id);
    setRequest(res.request);
    setReviewReason(String(res.request.reviewReason ?? ''));
    setAdminNotes(String(res.request.adminNotes ?? ''));
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (!request) return <p className="text-slate-400">جارٍ التحميل...</p>;

  const documents = (request.documents as Record<string, unknown>[] | undefined) ?? [];
  const user = request.user as Record<string, unknown> | undefined;

  const updateStatus = async (status: string) => {
    await updateVerificationRequest(id, { status, reviewReason, adminNotes });
    await load();
  };

  return (
    <div>
      <PageHeader
        title="مراجعة طلب التوثيق"
        description={String(user?.arabicName || user?.username || '')}
        actions={<Button variant="ghost" onClick={() => router.back()}>رجوع</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <p><Badge tone="warning">{String(request.status)}</Badge></p>
          <p className="text-slate-300">الاسم: {String(request.fullName ?? '—')}</p>
          <p className="text-slate-300">الهوية: {String(request.nationalId ?? '—')}</p>
          <p className="text-slate-300">المنشأة: {String(request.businessName ?? '—')}</p>
          <p className="text-slate-300">نوع النشاط: {String(request.businessType ?? '—')}</p>
          <p className="text-slate-400 whitespace-pre-wrap">{String(request.additionalInfo ?? '')}</p>
          <div className="space-y-2 pt-2">
            <p className="text-sm text-slate-400">المستندات</p>
            {documents.map((doc) => (
              <a
                key={String(doc.id)}
                href={String(doc.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="block text-emerald-400 text-sm underline"
              >
                {String(doc.originalFileName || doc.type)}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <label className="text-sm text-slate-400">سبب للمستخدم (رفض / تعديل)</label>
          <textarea
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            rows={4}
          />
          <label className="text-sm text-slate-400">ملاحظات داخلية</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            rows={4}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void updateStatus('UNDER_REVIEW')}>بدء المراجعة</Button>
            <Button variant="secondary" onClick={() => void updateStatus('NEEDS_AMENDMENTS')}>
              طلب تعديلات
            </Button>
            <Button variant="primary" onClick={() => void updateStatus('VERIFIED')}>قبول</Button>
            <Button variant="ghost" onClick={() => void updateStatus('REJECTED')}>رفض</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
