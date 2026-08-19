const PRODUCTION_ORIGINS = [
  'https://sarh.app',
  'https://www.sarh.app',
  'https://sarh-new4.onrender.com',
];

const STALE_ORIGIN_MARKERS = ['railway.app'];

function isLocalOrigin(origin: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(origin);
}

function isStaleOrigin(origin: string): boolean {
  return STALE_ORIGIN_MARKERS.some((marker) => origin.includes(marker));
}

/** Allowed browser origins. Native clients send no Origin and are unaffected. */
export function resolveCorsOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '').trim();
  if (frontend) fromEnv.push(frontend);
  const butcherDashboard = (process.env.BUTCHER_DASHBOARD_URL || '')
    .replace(/\/$/, '')
    .trim();
  if (butcherDashboard) fromEnv.push(butcherDashboard);

  const production = process.env.NODE_ENV === 'production';
  const origins = new Set<string>();

  for (const origin of fromEnv) {
    if (isStaleOrigin(origin)) continue;
    if (production && isLocalOrigin(origin)) continue;
    origins.add(origin);
  }

  if (production) {
    for (const origin of PRODUCTION_ORIGINS) origins.add(origin);
  } else if (origins.size === 0) {
    origins.add('http://localhost:8081');
  }

  if (!production) {
    origins.add('http://localhost:3002');
    origins.add('http://127.0.0.1:3002');
    origins.add('http://localhost:3003');
    origins.add('http://127.0.0.1:3003');
  }

  return [...origins];
}

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  return resolveCorsOrigins().includes(origin);
}
