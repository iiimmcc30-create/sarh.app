import { readFileSync } from 'fs';
import path from 'path';
import {
  FEED_CATEGORY_FILTERS,
  mapsUrl,
  telUrl,
  whatsappUrl,
} from '../lib/feedSuppliers';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

describe('feed supplier directory helpers', () => {
  it('exposes the requested category chips', () => {
    expect(FEED_CATEGORY_FILTERS.map((item) => item.label)).toEqual([
      'الكل',
      'أعلاف مواشي',
      'أعلاف أغنام',
      'أعلاف إبل',
      'أعلاف دواجن',
      'تبن',
      'شعير',
    ]);
  });

  it('builds WhatsApp, phone, and map links from supplier data', () => {
    expect(whatsappUrl('+966 55 123 4567')).toBe('https://wa.me/966551234567');
    expect(telUrl('+966551234567')).toBe('tel:+966551234567');
    expect(mapsUrl({ lat: 24.7, lng: 46.7 })).toBe('https://maps.google.com/?q=24.7,46.7');
    expect(mapsUrl({ addressAr: 'الرياض' })).toBe(
      `https://maps.google.com/?q=${encodeURIComponent('الرياض')}`,
    );
    expect(whatsappUrl('')).toBeNull();
    expect(mapsUrl({})).toBeNull();
  });
});

describe('feed supplier screens stay a public directory', () => {
  const list = src('app/feed-suppliers/index.tsx');
  const details = src('app/feed-suppliers/[id].tsx');
  const sidebar = src('components/feature/AppSidebar.tsx');
  const explore = src('components/feature/ExploreSarhSection.tsx');

  it('keeps the sidebar item directly under ملاحم سرح', () => {
    const butchersAt = sidebar.indexOf("label: 'ملاحم سرح'");
    const feedAt = sidebar.indexOf("label: 'موردو الأعلاف'");
    expect(butchersAt).toBeGreaterThan(-1);
    expect(feedAt).toBeGreaterThan(butchersAt);
    expect(sidebar).toContain("route: '/feed-suppliers'");
  });

  it('opens the directory from the home explore CTA', () => {
    expect(explore.indexOf('href="/butchers"')).toBeLessThan(
      explore.indexOf('href="/feed-suppliers"'),
    );
    expect(explore).toContain('استكشف');
    expect(explore).toContain('explore-sarh-feed-suppliers.jpg');
    expect(explore).not.toContain('تصفح واستكشف أبرز الموردين');
  });

  it('searches suppliers and products without follow or cart actions', () => {
    expect(list).toContain('ابحث عن مورد أو منتج...');
    expect(list).toContain('لا يوجد موردون متاحون حالياً');
    expect(list).toContain('/feed-suppliers/[id]');
    expect(list).not.toContain('متابعة');
    expect(list).not.toContain('سلة');
    expect(list).not.toContain('شراء');
  });

  it('exposes WhatsApp, call, and map actions on the supplier page', () => {
    expect(details).toContain('واتساب');
    expect(details).toContain('اتصال');
    expect(details).toContain('عرض الموقع');
    expect(details).toContain('whatsappUrl');
    expect(details).toContain('telUrl');
    expect(details).toContain('mapsUrl');
    expect(details).toContain('لا توجد منتجات متاحة حالياً');
    expect(details).not.toContain('شراء');
    expect(details).not.toContain('سلة');
    expect(details).not.toContain('متابعة');
  });
});
