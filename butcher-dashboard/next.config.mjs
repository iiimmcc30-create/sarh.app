/** @type {import('next').NextConfig} */
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
// Guard: proxy must target backend (:3001), never this dashboard (:3002) or admin (:3000)
const apiUrl = /:(3000|3002|3003)(\/|$)/.test(rawApiUrl)
  ? 'http://127.0.0.1:3001'
  : rawApiUrl.replace(/\/$/, '').replace('localhost', '127.0.0.1');

const nextConfig = {
  // Vercel uses its own output tracing; standalone is for Docker/self-host.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
