import { EmptyState } from '@/components/ui/EmptyState';
import { Construction } from 'lucide-react';

export function PhasePlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <EmptyState
        icon={Construction}
        title="ستتوفر هذه الصفحة في المرحلة التالية"
        description="مرحلة الأساس تشمل تسجيل الدخول، التحقق من ارتباط الملحمة، والهيكل العام فقط. لا توجد بيانات وهمية هنا."
      />
    </div>
  );
}
