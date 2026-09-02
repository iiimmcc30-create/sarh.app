import { DaftraClient } from './daftra.http-client';
import { DaftraRequestError } from './daftra.errors';
import {
  assertValidDaftraAccountIdentifier,
  daftraApiKeyInfoUrl,
  resolveDaftraOrigin,
  testDaftraConnection,
} from './daftra.client';

function jsonFetch(
  status: number,
  body: unknown,
  inspect?: (init: RequestInit) => void,
) {
  return jest.fn(async (_url: string, init?: RequestInit) => {
    inspect?.(init ?? {});
    return {
      status,
      json: async () => body,
    };
  }) as unknown as typeof fetch;
}

describe('daftra.client + DaftraClient', () => {
  it('builds api2 key-info URL from account identifier', () => {
    expect(daftraApiKeyInfoUrl('AcmeShop')).toBe(
      'https://acmeshop.daftra.com/api2/api_key_info.json',
    );
  });

  it('rejects unsafe account identifiers', () => {
    expect(() =>
      assertValidDaftraAccountIdentifier('https://evil.example/x'),
    ).toThrow();
    expect(() => assertValidDaftraAccountIdentifier('a b')).toThrow();
  });

  it('uses DAFTRA_API_BASE_URL only when the tenant placeholder is present', () => {
    const prev = process.env.DAFTRA_API_BASE_URL;
    process.env.DAFTRA_API_BASE_URL = 'https://{account}.example.test';
    expect(resolveDaftraOrigin('Shop-A')).toBe('https://shop-a.example.test');
    process.env.DAFTRA_API_BASE_URL = 'https://shared.example.test';
    expect(resolveDaftraOrigin('shop-a')).toBe('https://shop-a.daftra.com');
    process.env.DAFTRA_API_BASE_URL = prev;
  });

  it('connects with a valid API key and never sends Authorization', async () => {
    let headers: Record<string, string> = {};
    const fetchImpl = jsonFetch(
      200,
      { result: 'success', code: 200, data: { key: 'SUPER_SECRET_KEY' } },
      (init) => {
        headers = init.headers as Record<string, string>;
      },
    );
    const result = await testDaftraConnection(
      { accountIdentifier: 'shop1', apiKey: 'SUPER_SECRET_KEY' },
      fetchImpl,
    );
    expect(result).toEqual({ connected: true, httpStatus: 200 });
    expect(headers.APIKEY).toBe('SUPER_SECRET_KEY');
    expect(headers.Authorization).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('SUPER_SECRET');
  });

  it('treats a missing API key as INVALID_API_KEY without calling fetch', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    const result = await testDaftraConnection(
      { accountIdentifier: 'shop1', apiKey: '   ' },
      fetchImpl,
    );
    expect(result.connected).toBe(false);
    if (!result.connected) expect(result.reason).toBe('INVALID_API_KEY');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps invalid API key without leaking the secret', async () => {
    const result = await testDaftraConnection(
      { accountIdentifier: 'shop1', apiKey: 'SUPER_SECRET_KEY' },
      jsonFetch(401, { result: 'failed', message: 'bad key ABCDEF' }),
    );
    expect(result.connected).toBe(false);
    if (!result.connected) {
      expect(result.reason).toBe('INVALID_API_KEY');
      expect(result.safeReason).not.toContain('SUPER_SECRET');
      expect(result.safeReason).not.toContain('ABCDEF');
    }
  });

  it('maps timeout to CONNECTION_FAILED', async () => {
    const fetchImpl = jest.fn(async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }) as unknown as typeof fetch;
    const result = await testDaftraConnection(
      { accountIdentifier: 'shop1', apiKey: 'SUPER_SECRET_KEY' },
      fetchImpl,
    );
    expect(result.connected).toBe(false);
    if (!result.connected) expect(result.reason).toBe('CONNECTION_FAILED');
  });

  it('maps network failure to CONNECTION_FAILED', async () => {
    const fetchImpl = jest.fn(async () => {
      throw new Error('ECONNRESET');
    }) as unknown as typeof fetch;
    const result = await testDaftraConnection(
      { accountIdentifier: 'shop1', apiKey: 'x'.repeat(20) },
      fetchImpl,
    );
    expect(result.connected).toBe(false);
    if (!result.connected) expect(result.reason).toBe('CONNECTION_FAILED');
  });

  it('paginates products and normalizes empty lists', async () => {
    const client = new DaftraClient({
      origin: 'https://shop1.daftra.com',
      apiKey: 'k'.repeat(20),
      fetchImpl: jsonFetch(200, {
        result: 'success',
        data: [],
        pagination: { page: 1, page_count: 1, total_results: 0 },
      }),
    });
    const res = await client.get('/products.json', { page: 1, limit: 20 });
    expect(res.body).toMatchObject({ data: [] });
  });

  it('throws a safe error on Daftra product API failure', async () => {
    const client = new DaftraClient({
      origin: 'https://shop1.daftra.com',
      apiKey: 'k'.repeat(20),
      fetchImpl: jsonFetch(500, {
        result: 'failed',
        message: 'key leaked-secret',
      }),
    });
    await expect(client.get('/products.json')).rejects.toBeInstanceOf(
      DaftraRequestError,
    );
    try {
      await client.get('/products.json');
    } catch (err) {
      expect(String(err)).not.toContain('leaked-secret');
      expect(String(err)).not.toContain('k'.repeat(20));
    }
  });
});
