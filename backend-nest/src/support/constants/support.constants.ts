export const SUPPORT_TICKET_CATEGORIES = [
  'ACCOUNT',
  'ADS',
  'MARKET',
  'BUY_SELL',
  'PAYMENT',
  'VERIFICATION',
  'BUTCHERS',
  'TECHNICAL',
  'OTHER',
] as const;

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];

export const SUPPORT_TICKET_CATEGORY_LABEL_AR: Record<SupportTicketCategory, string> = {
  ACCOUNT: 'الحساب',
  ADS: 'الإعلانات',
  MARKET: 'السوق',
  BUY_SELL: 'البيع والشراء',
  PAYMENT: 'الدفع',
  VERIFICATION: 'التوثيق',
  BUTCHERS: 'الملاحم',
  TECHNICAL: 'المشاكل التقنية',
  OTHER: 'أخرى',
};

export const TICKET_STATUS_LABEL_AR: Record<string, string> = {
  OPEN: 'جديدة',
  IN_REVIEW: 'قيد المراجعة',
  IN_PROGRESS: 'قيد المعالجة',
  AWAITING_USER: 'بانتظار رد المستخدم',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة',
};

export const VERIFICATION_STATUS_LABEL_AR: Record<string, string> = {
  DRAFT: 'لم يتم التقديم',
  UNDER_REVIEW: 'قيد المراجعة',
  NEEDS_AMENDMENTS: 'يحتاج تعديلات',
  VERIFIED: 'موثق',
  REJECTED: 'مرفوض',
};

export const FAQ_CATEGORY_LABEL_AR: Record<string, string> = {
  ACCOUNT: 'الحساب',
  ADS: 'الإعلانات',
  MARKET: 'السوق',
  BUY_SELL: 'البيع والشراء',
  PAYMENT: 'الدفع',
  VERIFICATION: 'التوثيق',
  BUTCHERS: 'الملاحم',
  TECHNICAL: 'المشاكل التقنية',
  GENERAL: 'عام',
};
