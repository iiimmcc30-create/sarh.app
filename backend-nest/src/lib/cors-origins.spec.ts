import { isAllowedCorsOrigin, resolveCorsOrigins } from './cors-origins';

describe('cors origins', () => {
  const keys = ['ALLOWED_ORIGINS', 'NODE_ENV', 'FRONTEND_URL'] as const;
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    snapshot = {};
    for (const key of keys) snapshot[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of keys) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
  });

  it('strips railway and localhost in production and keeps sarh.app', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS =
      'http://localhost:8081,https://sarh-app.up.railway.app,https://sarh.app';
    const origins = resolveCorsOrigins();
    expect(origins).toContain('https://sarh.app');
    expect(origins).toContain('https://www.sarh.app');
    expect(origins.some((origin) => origin.includes('railway'))).toBe(false);
    expect(origins.some((origin) => origin.includes('localhost'))).toBe(false);
    expect(isAllowedCorsOrigin('https://sarh.app')).toBe(true);
    expect(isAllowedCorsOrigin('https://evil.example')).toBe(false);
    expect(isAllowedCorsOrigin(undefined)).toBe(true);
  });

  it('ignores localhost FRONTEND_URL in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = '';
    process.env.FRONTEND_URL = 'http://localhost:8081';
    const origins = resolveCorsOrigins();
    expect(origins.some((origin) => origin.includes('localhost'))).toBe(false);
    expect(origins).toContain('https://sarh.app');
  });
});
