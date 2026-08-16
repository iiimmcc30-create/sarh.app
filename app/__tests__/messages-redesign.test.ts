import {
  formatOfferMessage,
  parseOfferMessage,
} from '../lib/messageOffers';
import { formatListingPrice } from '../lib/messageListingContext';
import { filterMessageThreads } from '../hooks/useMessageThreads';

describe('message offers', () => {
  it('formats and parses price offers', () => {
    const text = formatOfferMessage(2200);
    expect(text).toContain('عرض سعر');
    expect(parseOfferMessage(text)?.amount).toBe(2200);
  });

  it('rejects invalid offer text', () => {
    expect(parseOfferMessage('مرحبا')).toBeNull();
  });
});

describe('message listing helpers', () => {
  it('formats SAR prices', () => {
    expect(formatListingPrice(2500)).toBe('2,500 ر.س');
  });
});

describe('message thread filters', () => {
  const threads = [
    {
      id: '1',
      type: 'DIRECT' as const,
      participant: {
        id: 'u1',
        displayName: 'Mohammed',
        arabicName: 'محمد',
        verified: false,
      },
      lastMessage: 'مرحبا',
      lastMessageAt: '2026-08-16T10:00:00.000Z',
      unread: 2,
    },
    {
      id: '2',
      type: 'BUTCHER' as const,
      participant: {
        id: 'u2',
        displayName: 'Shop',
        arabicName: 'ملحمة',
        verified: false,
      },
      butcher: { id: 'b1', nameAr: 'ملحمة النور' },
      lastMessage: 'تم قبول الطلب',
      lastMessageAt: '2026-08-16T11:00:00.000Z',
      unread: 0,
    },
  ];

  it('filters unread and transactions without a search tab', () => {
    expect(filterMessageThreads(threads, 'unread', '', {}).map((t) => t.id)).toEqual([
      '1',
    ]);
    expect(
      filterMessageThreads(threads, 'transactions', '', {}).map((t) => t.id),
    ).toEqual(['2']);
  });

  it('searches listing titles from a single search bar', () => {
    expect(
      filterMessageThreads(threads, 'all', 'حري', { u1: 'حري - جذع' }).map(
        (t) => t.id,
      ),
    ).toEqual(['1']);
  });
});
