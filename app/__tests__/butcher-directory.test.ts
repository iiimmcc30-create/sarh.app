import {
  fetchSortedButchers,
  getButchersHomeSnapshot,
  isButchersHomeSnapshotFresh,
  loadButchersHome,
  resetButchersDirectoryCache,
} from '../services/butcherDirectory';

jest.mock('../services/api', () => ({
  API_BASE: 'https://example.test',
}));

jest.mock('../services/butcherMarketBanners', () => ({
  fetchButcherMarketBanners: jest.fn(async () => [{ id: 'b1', slot: 1, titleAr: 'عرض', subtitleAr: '', captionAr: '', imageUrl: '' }]),
}));

jest.mock('../services/butcherOffersPreview', () => ({
  BUTCHER_HOME_OFFERS_LIMIT: 20,
  fetchButcherOffersPreview: jest.fn(async () => []),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function butcherPayload(id: string) {
  return {
    id,
    nameAr: `ملحمة ${id}`,
    nameEn: id,
    country: 'SA',
    cityAr: 'الرياض',
    city: 'Riyadh',
    specialties: [],
  };
}

describe('butcher directory P0 cache and failures', () => {
  beforeEach(() => {
    resetButchersDirectoryCache();
    global.fetch = jest.fn();
  });

  it('throws on HTTP failure instead of returning an empty list', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ success: false }, 429));
    await expect(fetchSortedButchers('rating')).rejects.toThrow('butchers_fetch_failed');
    expect(getButchersHomeSnapshot()).toBeNull();
  });

  it('treats 200 + [] as a real empty directory', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, data: { butchers: [] } }),
    );
    await expect(fetchSortedButchers('rating')).resolves.toEqual([]);
  });

  it('keeps a successful payload in cache after the caller unmounts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, data: { butchers: [butcherPayload('1')] } }),
    );
    const pending = loadButchersHome();
    await pending;
    expect(isButchersHomeSnapshotFresh()).toBe(true);
    expect(getButchersHomeSnapshot()?.picks.map((b) => b.id)).toEqual(['1']);

    (global.fetch as jest.Mock).mockClear();
    const again = await loadButchersHome();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(again.picks.map((b) => b.id)).toEqual(['1']);
  });

  it('dedupes overlapping home loads so a remount does not start a second storm', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const first = loadButchersHome();
    const second = loadButchersHome();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    resolveFetch?.(
      jsonResponse({ success: true, data: { butchers: [butcherPayload('2')] } }),
    );
    const [a, b] = await Promise.all([first, second]);
    expect(a.picks.map((row) => row.id)).toEqual(['2']);
    expect(b.picks.map((row) => row.id)).toEqual(['2']);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite a cached home snapshot when a later fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, data: { butchers: [butcherPayload('ok')] } }),
    );
    await loadButchersHome();
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ success: false }, 500));
    await expect(loadButchersHome(undefined, { force: true })).rejects.toThrow(
      'butchers_fetch_failed',
    );
    expect(getButchersHomeSnapshot()?.picks.map((b) => b.id)).toEqual(['ok']);
  });
});
