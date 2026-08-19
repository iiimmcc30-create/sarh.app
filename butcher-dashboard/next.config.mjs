/** @type {import('next').NextConfig} */
function resolveApiOrigin() {
  let raw = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001')
    .trim()
    .replace(/^['"]|['"]$/g, '');
  if (!raw) raw = 'http://127.0.0.1:3001';
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  raw = raw.replace(/\/$/, '').replace(/\/api$/i, '');
  raw = raw.replace('localhost', '127.0.0.1');
  // Guard: proxy must target backend, never this dashboard or admin.
  if (/:(3000|3002|3003)(\/|$)/.test(raw)) {
    raw = 'http://127.0.0.1:3001';
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    // Vercel path-to-regexp treats ":3001" in 127.0.0.1:3001 as a named param.
    if (
      process.env.VERCEL &&
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

const apiUrl = resolveApiOrigin();

const nextConfig = {
  // Vercel uses its own output tracing; standalone is for Docker/self-host.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  async rewrites() {
    // Next/Vercel require destination to start with `/`, `http://`, or `https://`.
    // A host-only NEXT_PUBLIC_API_URL (no scheme) produced
    // `sarh-new4.onrender.com/api/:path*` → "Invalid rewrite found".
    if (!apiUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
