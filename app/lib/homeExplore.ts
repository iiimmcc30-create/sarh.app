export type HomeExploreDestinationKey =
  | 'community'
  | 'butchers'
  | 'listings'
  | 'services'
  | 'news'
  | 'live'
  | 'promote';

export type HomeExploreCard = {
  id?: string;
  destination: HomeExploreDestinationKey;
  titleAr: string;
  descriptionAr: string;
  icon: string;
  route: string;
  sortOrder?: number;
  isActive?: boolean;
  requiresPaidServices?: boolean;
};

const CATALOG: Record<
  HomeExploreDestinationKey,
  Omit<HomeExploreCard, 'destination' | 'id' | 'sortOrder' | 'isActive'>
> = {
  community: {
    titleAr: 'مجتمع سرح',
    descriptionAr: 'نقاشات-تجارب-اسئلة-معرفه',
    icon: 'people-outline',
    route: '/(tabs)/posts',
  },
  butchers: {
    titleAr: 'سوق الملاحم',
    descriptionAr: 'تصفح منتجات الملاحم والطلبات',
    icon: 'storefront-outline',
    route: '/butchers',
  },
  listings: {
    titleAr: 'السوق',
    descriptionAr: 'اعلانات البيع والشراء والمنتجات',
    icon: 'pricetag-outline',
    route: '/(tabs)/market',
  },
  services: {
    titleAr: 'خدمات الوزارة',
    descriptionAr: 'الخدمات الالكترونية-التراخيص-التصاريح',
    icon: 'briefcase-outline',
    route: '/sarh-services',
  },
  news: {
    titleAr: 'قطاع الأخبار',
    descriptionAr: 'اخبار الوزارة-القرارات-الفعاليات',
    icon: 'newspaper-outline',
    route: '/news',
  },
  live: {
    titleAr: 'البث المباشر',
    descriptionAr: 'بثوث مباشرة من السوق',
    icon: 'videocam-outline',
    route: '/(tabs)/live',
  },
  promote: {
    titleAr: 'تعزيز سرح',
    descriptionAr: 'روّج إعلانك وزد ظهوره',
    icon: 'megaphone-outline',
    route: '/promote',
    requiresPaidServices: true,
  },
};

export const FALLBACK_HOME_EXPLORE: HomeExploreCard[] = (
  ['community', 'butchers', 'listings', 'services', 'news'] as HomeExploreDestinationKey[]
).map((destination, sortOrder) => ({
  destination,
  sortOrder,
  isActive: true,
  ...CATALOG[destination],
}));

/** First row takes the extra card when the count is odd — matches 3+2 for the default five. */
export function splitExploreRows<T>(items: T[]): { top: T[]; bottom: T[] } {
  if (items.length <= 1) return { top: items, bottom: [] };
  const mid = Math.ceil(items.length / 2);
  return { top: items.slice(0, mid), bottom: items.slice(mid) };
}

export function resolveExploreCard(
  raw: Partial<HomeExploreCard> & { destination?: string },
): HomeExploreCard | null {
  const key = raw.destination as HomeExploreDestinationKey;
  const meta = CATALOG[key];
  if (!meta) return null;
  return {
    id: raw.id,
    destination: key,
    titleAr: meta.titleAr,
    descriptionAr: meta.descriptionAr,
    icon: meta.icon,
    route: meta.route,
    sortOrder: raw.sortOrder,
    isActive: raw.isActive,
    requiresPaidServices: meta.requiresPaidServices,
  };
}
