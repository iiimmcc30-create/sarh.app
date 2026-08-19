'use client';

import { Store } from 'lucide-react';
import { useButcherSession } from '@/components/layout/ButcherSessionProvider';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DashboardHomePage() {
  const { butcher } = useButcherSession();
  const open = butcher?.isOpen === true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">الرئيسية</h1>
        <p className="mt-1 text-sm text-ink-muted">ملخص ملحمتك — البيانات الحقيقية فقط، بدون أرقام وهمية.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-surface p-5">
          <p className="text-sm text-ink-muted">الملحمة</p>
          <p className="mt-2 text-xl font-semibold text-ink">{butcher?.nameAr ?? '—'}</p>
          <p className="mt-1 text-sm text-ink-secondary">{butcher?.nameEn}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface p-5">
          <p className="text-sm text-ink-muted">الحالة</p>
          <p className={`mt-2 text-xl font-semibold ${open ? 'text-brand' : 'text-ink'}`}>
            {open ? 'مفتوحة' : 'مغلقة'}
          </p>
          <p className="mt-1 text-sm text-ink-secondary">{butcher?.cityAr || butcher?.city}</p>
        </div>
      </section>
      <EmptyState
        icon={Store}
        title="ملخص الطلبات والمبيعات سيظهر هنا في المرحلة التالية"
        description="مرحلة الأساس تثبت تسجيل الدخول وارتباط الحساب بملحمتك. جداول الطلبات والتقارير الحقيقية تُبنى بعد الموافقة على المرحلة 2."
      />
    </div>
  );
}
