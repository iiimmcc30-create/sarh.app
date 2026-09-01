import {
  assertValidDaftraAccountIdentifier,
  daftraApiKeyInfoUrl,
  testDaftraConnection,
} from './daftra.client';

describe('daftra.client', () => {
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

  it('reports connected on HTTP 200 JSON success without exposing the key', async () => {
    const fetchImpl = jest.fn(async () => ({
      status: 200,
      json: async () => ({
        result: 'success',
        code: 200,
        data: { key: 'SUPER_SECRET_KEY' },
      }),
    })) as unknown as typeof fetch;

    const result = await testDaftraConnection(
      { accountIdentifier: 'shop1', apiKey: 'SUPER_SECRET_KEY' },
      fetchImpl,
    );
    expect(result).toEqual({ ok: true, httpStatus: 200 });
    const sent = (fetchImpl.mock.calls[0] as unknown[])[1] as {
      headers: Record<string, string>;
    };
    expect(sent.headers.APIKEY).toBe('SUPER_SECRET_KEY');
    expect(sent.headers.Authorization).toBeUndefined();
  });

  it('returns a safe failure on 401', async () => {
    const fetchImpl = jest.fn(async () => ({
      status: 401,
      json: async () => ({ result: 'failed', message: 'bad key ABCDEF' }),
    })) as unknown as typeof fetch;

    const result = await testDaftraConnection(
      { accountIdentifier: 'shop1', apiKey: 'SUPER_SECRET_KEY' },
      fetchImpl,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.safeReason).not.toContain('SUPER_SECRET');
      expect(result.safeReason).not.toContain('ABCDEF');
    }
  });
});
