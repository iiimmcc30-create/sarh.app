import type { ThemeColors } from '@/constants/theme';
import type {
  ButcherApplicationDocumentStatus,
  ButcherApplicationDocumentType,
  ButcherApplicationStatus,
  ButcherApplicationTimelineAction,
  GccCountry,
} from '@/services/butcherApplicationTypes';

type ApplicationStatusMeta = { label: string; color: string; bg: string };

export function getApplicationStatusMeta(
  status: ButcherApplicationStatus,
  colors: ThemeColors,
): ApplicationStatusMeta {
  const meta: Record<ButcherApplicationStatus, ApplicationStatusMeta> = {
    DRAFT: { label: 'مسودة', color: colors.textSecondary, bg: colors.bgElevated },
    SUBMITTED: { label: 'قيد المراجعة', color: colors.amber, bg: `${colors.amber}26` },
    APPROVED: { label: 'مقبول', color: colors.success, bg: `${colors.success}26` },
    REJECTED: { label: 'مرفوض', color: colors.danger, bg: `${colors.danger}26` },
    WITHDRAWN: { label: 'مسحوب', color: colors.textMuted, bg: colors.bgGlass },
  };
  return meta[status];
}

export const DOCUMENT_TYPE_LABELS: Record<ButcherApplicationDocumentType, string> = {
  commercial_license: 'السجل التجاري',
  national_id: 'الهوية الوطنية',
  municipal_permit: 'تصريح البلدية',
  shop_photo: 'صورة المحل',
  other: 'مستند آخر',
};

export const DOCUMENT_STATUS_LABELS: Record<ButcherApplicationDocumentStatus, string> = {
  UPLOADED: 'تم الرفع',
  APPROVED: 'تم الاعتماد',
  REJECTED: 'مرفوض',
};

export const TIMELINE_ACTION_LABELS: Record<ButcherApplicationTimelineAction, string> = {
  CREATE: 'إنشاء الطلب',
  UPDATE: 'تحديث البيانات',
  SUBMIT: 'تقديم الطلب',
  APPROVE: 'قبول الطلب',
  REJECT: 'رفض الطلب',
  WITHDRAW: 'سحب الطلب',
  COMMENT: 'تعليق',
};

const GCC_COUNTRY_LABELS: Record<GccCountry, string> = {
  SA: 'السعودية',
  AE: 'الإمارات',
  KW: 'الكويت',
  QA: 'قطر',
  BH: 'البحرين',
  OM: 'عُمان',
  EG: 'مصر',
};

export function countryLabel(code: GccCountry | null | undefined): string {
  if (!code) return '—';
  return GCC_COUNTRY_LABELS[code] ?? code;
}

export function formatApplicationDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatApplicationDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function applicationDisplayName(nameAr: string | null, nameEn: string | null): string {
  return nameAr?.trim() || nameEn?.trim() || 'طلب تسجيل ملحمة';
}
