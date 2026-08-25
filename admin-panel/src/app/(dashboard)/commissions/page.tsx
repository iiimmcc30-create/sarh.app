'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Breadcrumbs, PageState } from '@/components/ui/AdminChrome';
import { fetchDashboardStats, type DashboardStats } from '@/services/dashboard.service';
import { getStoredUser } from '@/services/auth.service';
import { Percent, Wallet } from 'lucide-react';

export default function CommissionsPage() {
  const user = getStoredUser();
  const isAdmin = user?.role === 'ADMIN';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchDashboardStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <PageState
        kind="error"
        message="مركز العمولات متاح لمسؤول النظام (ADMIN) فقط"
      />
    );
  }

  if (error) return <PageState kind="error" message={error} />;
  if (!stats?.commission) {
    return <PageState kind="loading" message="جارٍ تحميل ملخص العمولات..." />;
  }

  const c = stats.commission;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'لوحة التحكم', href: '/' },
          { label: 'العمولات' },
        ]}
      />
      <PageHeader
        title="مركز العمولات"
        description="عرض فقط — لا تعديل للنسب من هذه الشاشة"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="عمولة الملاحم (فعّالة)"
          value={`${c.butcherStoreRatePercent}%`}
          subtitle="داخلي — لا يُعرض للملاحم أو الموبايل"
          icon={Percent}
          accent="violet"
        />
        <StatCard
          title="إجمالي عمولات مدفوعة"
          value={`${c.listingFeesPaidTotal.toLocaleString('ar-SA')} ر.س`}
          subtitle={`${c.listingFeesPaidCount} رسوم إعلان متجر`}
          icon={Wallet}
        />
        <StatCard
          title="عمولات مستحقة"
          value={`${c.listingFeesOutstandingTotal.toLocaleString('ar-SA')} ر.س`}
          subtitle={`${c.listingFeesOutstandingCount} سجل`}
          icon={Wallet}
          accent="amber"
        />
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-300">
        <h2 className="font-semibold text-white">مصدر الحقيقة</h2>
        <p>{c.noteAr}</p>
        <ul className="list-disc space-y-1 pr-5 text-slate-400">
          <li>
            الحساب في <code className="text-emerald-300">backend-nest/src/lib/commissions.ts</code>
          </li>
          <li>
            الإعفاء عندما تكون صلاحية الباقة <code>storeCommission &lt;= 0</code>
          </li>
          <li>عمولة إعلانات المواشي/المعدات لم تُغيَّر في هذه المرحلة</li>
          <li>لا تُعرض النسبة الرقمية في لوحة الملحمة أو تطبيق الموبايل</li>
        </ul>
      </div>
    </div>
  );
}
