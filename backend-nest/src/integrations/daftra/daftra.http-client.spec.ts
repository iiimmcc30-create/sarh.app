import { DaftraClient } from './daftra.http-client';
import { DaftraRequestError } from './daftra.errors';

function jsonFetch(status: number, body: unknown) {
  return jest.fn(async () => ({
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe('DaftraClient HTTP mapping', () => {
  const secret = 'k'.repeat(24);

  it('maps 429 without leaking the API key', async () => {
    const client = new DaftraClient({
      origin: 'https://shop1.daftra.com',
      apiKey: secret,
      fetchImpl: jsonFetch(429, { result: 'failed', message: secret }),
    });
    await expect(client.get('/products.json')).rejects.toMatchObject({
      reason: 'RATE_LIMITED',
    });
    try {
      await client.get('/products.json');
    } catch (err) {
      expect(err).toBeInstanceOf(DaftraRequestError);
      expect(String(err)).not.toContain(secret);
    }
  });

  it('maps 404 to NOT_FOUND', async () => {
    const client = new DaftraClient({
      origin: 'https://shop1.daftra.com',
      apiKey: secret,
      fetchImpl: jsonFetch(404, { result: 'failed' }),
    });
    await expect(client.get('/products/9.json')).rejects.toMatchObject({
      reason: 'NOT_FOUND',
    });
  });

  it('does not treat a generic 500 failed result as an invalid API key', async () => {
    const client = new DaftraClient({
      origin: 'https://shop1.daftra.com',
      apiKey: secret,
      fetchImpl: jsonFetch(500, { result: 'failed', message: 'boom' }),
    });
    await expect(client.get('/products.json')).rejects.toMatchObject({
      reason: 'UPSTREAM_ERROR',
    });
  });
});
