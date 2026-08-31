import { listingFavoriteFeedback } from '@/lib/listingFavorite';

describe('H8 listing favorites', () => {
  it('does not claim fake success when no listing-favorite API exists', () => {
    const feedback = listingFavoriteFeedback();
    expect(feedback.kind).toBe('unavailable');
    expect(feedback.title).not.toMatch(/تم الحفظ/);
    expect(feedback.message).not.toMatch(/تم حفظ/);
  });

  it('does not reuse post bookmark semantics', () => {
    const feedback = listingFavoriteFeedback();
    expect(JSON.stringify(feedback)).not.toMatch(/bookmark/i);
    expect(JSON.stringify(feedback)).not.toMatch(/post/i);
  });
});
