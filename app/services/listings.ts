import { ensureApiReachable } from './api';
import { countries, type Listing, type Country } from './types';

type BackendListing = {
  id: string;
  title: string;
  arabicTitle: string;
  price: number;
  currency?: string;
  category: Listing['category'];
  categoryId?: string | null;
  subcategoryId?: string | null;
  marketCategory?: {
    id: string;
    nameAr: string;
    slug: string;
    requiresWeight?: boolean;
  } | null;
  marketSubcategory?: {
    id: string;
    nameAr: string;
    slug: string;
    requiresWeight?: boolean;
  } | null;
  breed?: string;
  age?: string;
  location: string;
  arabicLocation: string;
  country: Listing['country'];
  contactPhone?: string;
  weightKg?: number;
  images?: string[];
  description: string;
  arabicDescription: string;
  featured?: boolean;
  pinned?: boolean;
  promoted?: boolean;
  promotedUntil?: string;
  promotionWeight?: number;
  views?: number;
  createdAt: string;
  seller: {
    id: string;
    username: string;
    displayName?: string;
    arabicName?: string;
    avatar?: string;
    verified?: boolean;
    country?: string;
  };
};

function mapListing(l: BackendListing): Listing {
  const sellerCountry: Country =
    l.seller.country && l.seller.country in countries
      ? (l.seller.country as Country)
      : 'SA';

  return {
    id: l.id,
    title: l.title,
    arabicTitle: l.arabicTitle,
    price: l.price,
    currency: l.currency || 'SAR',
    category: l.category,
    categoryId: l.categoryId ?? l.marketCategory?.id,
    subcategoryId: l.subcategoryId ?? l.marketSubcategory?.id,
    categoryNameAr: l.marketCategory?.nameAr,
    subcategoryNameAr: l.marketSubcategory?.nameAr,
    breed: l.breed || '',
    age: l.age || '',
    location: l.location,
    arabicLocation: l.arabicLocation,
    country: l.country,
    contactPhone: l.contactPhone,
    weightKg: l.weightKg,
    requiresWeight:
      l.marketCategory?.requiresWeight === true ||
      l.marketSubcategory?.requiresWeight === true ||
      l.category === 'slaughter',
    images: l.images?.length ? l.images : [],
    description: l.description,
    arabicDescription: l.arabicDescription,
    seller: {
      id: l.seller.id,
      username: l.seller.username,
      displayName: l.seller.displayName || '',
      arabicName: l.seller.arabicName || '',
      avatar: l.seller.avatar,
      verified: l.seller.verified ?? false,
      followers: 0,
      following: 0,
      rating: null,
      reviewCount: 0,
      country: sellerCountry,
      bio: '',
    },
    featured: l.featured ?? false,
    pinned: l.pinned ?? false,
    promoted: l.promoted ?? false,
    promotedUntil: l.promotedUntil,
    promotionWeight: l.promotionWeight,
    postedAt: new Date(l.createdAt).toLocaleDateString('ar-SA'),
    createdAt: l.createdAt,
    views: typeof l.views === 'number' ? l.views : undefined,
  };
}

export type ListingSearchParams = {
  search?: string;
  category?: string;
  categoryId?: string;
  subcategoryId?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  cursor?: string;
  sellerId?: string;
};

export async function searchListings(
  params: ListingSearchParams,
  accessToken?: string | null,
): Promise<Listing[]> {
  const base = await ensureApiReachable();
  const qs = new URLSearchParams();
  if (params.search && params.search.length >= 2) qs.set('search', params.search);
  if (params.category) qs.set('category', params.category);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.subcategoryId) qs.set('subcategoryId', params.subcategoryId);
  if (params.country) qs.set('country', params.country);
  if (params.minPrice != null) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) qs.set('maxPrice', String(params.maxPrice));
  if (params.cursor) qs.set('cursor', params.cursor);
  if (params.sellerId) qs.set('sellerId', params.sellerId);

  const headers: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
  const res = await fetch(`${base.replace(/\/$/, '')}/api/listings?${qs.toString()}`, { headers });
  if (!res.ok) return [];

  const json = await res.json();
  if (!json.success || !Array.isArray(json.data?.listings)) return [];
  return json.data.listings.map(mapListing);
}
