import { API_BASE } from '@/services/api';

export type OfficialService = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  externalUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export const OFFICIAL_SERVICE_CATEGORY_ORDER = [
  'veterinary',
  'livestock',
  'slaughter',
] as const;

export const OFFICIAL_SERVICE_CATEGORY_META: Record<
  string,
  { label: string; emoji: string }
> = {
  veterinary: { label: 'الخدمات البيطرية', emoji: '🏥' },
  livestock: { label: 'خدمات الماشية', emoji: '🐑' },
  slaughter: { label: 'خدمات المسالخ', emoji: '🔪' },
};

/** Embedded fallback when API is unavailable or not yet deployed */
export const FALLBACK_OFFICIAL_SERVICES: OfficialService[] = [
  {
    id: 'fallback-veterinary-registry',
    title: 'إصدار سجل مربي',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة تمكن هذه الخدمة المواطنين من ملاك الحيوانات لطلب إصدار سجل مربي.',
    category: 'veterinary',
    icon: 'document-text-outline',
    externalUrl:
      'https://anaam.mewa.gov.sa/anaam/ClinicRequestCardIssues/index?ClinicTypeId=fVfSs82hxvWEJfDm0UT+SA==',
    active: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'fallback-veterinary-clinic',
    title: 'طلب موعد زيارة عيادة بيطرية',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة تمكن هذه الخدمة المواطنين الحاصلين على سجل مربي من تقديم طلب موعد زيارة العيادة البيطرية التابعة لهم.',
    category: 'veterinary',
    icon: 'medical-outline',
    externalUrl:
      'https://naama.sa/services/details/443c9549-acdd-4a2a-a13a-2f878921c556',
    active: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'fallback-veterinary-vaccine',
    title: 'موعد التحصينات',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة تمكن هذه الخدمة المواطنين من ملاك الحيوانات من طلب موعد من العيادة التابعة لتحصين المواشي.',
    category: 'veterinary',
    icon: 'shield-checkmark-outline',
    externalUrl:
      'https://naama.sa/services/details/167e9681-249e-4101-b714-aeacecd22a06',
    active: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'fallback-livestock-numbering',
    title: 'طلب ترقيم الماشية',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة تسمح للمستفيدين بطلب ترقيم الماشية إلكترونياً.',
    category: 'livestock',
    icon: 'barcode-outline',
    externalUrl:
      'https://ui.naama.sa/livestocknumbering/livestock-numbering/enduser/livestock-numbering',
    active: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'fallback-livestock-data',
    title: 'إدارة بيانات الماشية',
    description:
      'خدمة إلكترونية مقدمة من وزارة البيئة والمياه والزراعة تمكن ملاك الماشية في المملكة من تحديث بيانات الماشية الخاصة بهم.',
    category: 'livestock',
    icon: 'list-outline',
    externalUrl:
      'https://ui.naama.sa/livestocknumbering/livestock-numbering/enduser/livestock-data-management',
    active: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'fallback-slaughter-booking',
    title: 'حجز موعد مسلخ',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة للحجز الإلكتروني للذبح في المسالخ، وتمكن المستفيدين أفراد أو أصحاب الملاحم من الحجز المسبق.',
    category: 'slaughter',
    icon: 'cut-outline',
    externalUrl: 'https://web.naama.sa/slaughter/appointment/termsconditions',
    active: true,
    createdAt: '',
    updatedAt: '',
  },
];

export type FetchOfficialServicesResult = {
  services: OfficialService[];
  fromApi: boolean;
};

export async function fetchOfficialServices(): Promise<FetchOfficialServicesResult> {
  try {
    const res = await fetch(`${API_BASE}/api/services`, {
      headers: { Accept: 'application/json' },
    });
    const json = await res.json().catch(() => ({}));
    if (
      res.ok &&
      json.success &&
      Array.isArray(json.data?.services) &&
      json.data.services.length > 0
    ) {
      return { services: json.data.services as OfficialService[], fromApi: true };
    }
  } catch {
    // network error — use fallback
  }
  return { services: FALLBACK_OFFICIAL_SERVICES, fromApi: false };
}

export function groupOfficialServicesByCategory(
  services: OfficialService[],
): Array<{ category: string; label: string; emoji: string; items: OfficialService[] }> {
  const buckets = new Map<string, OfficialService[]>();
  for (const service of services) {
    const list = buckets.get(service.category) ?? [];
    list.push(service);
    buckets.set(service.category, list);
  }

  const orderedKeys = [
    ...OFFICIAL_SERVICE_CATEGORY_ORDER.filter((key) => buckets.has(key)),
    ...[...buckets.keys()].filter(
      (key) =>
        !OFFICIAL_SERVICE_CATEGORY_ORDER.includes(
          key as typeof OFFICIAL_SERVICE_CATEGORY_ORDER[number],
        ),
    ),
  ];

  return orderedKeys.map((category) => {
    const meta = OFFICIAL_SERVICE_CATEGORY_META[category] ?? {
      label: category,
      emoji: '📋',
    };
    return {
      category,
      label: meta.label,
      emoji: meta.emoji,
      items: buckets.get(category) ?? [],
    };
  });
}
