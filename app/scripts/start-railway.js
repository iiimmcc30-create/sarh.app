/**
 * Dev against production Railway API (no local backend required).
 * Usage: npm run start:railway
 */
const RAILWAY_API = 'https://sarh-app.up.railway.app';

process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || RAILWAY_API;
process.env.EXPO_PUBLIC_SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || RAILWAY_API;
// Prevent web-only same-origin flag from leaking into native Metro bundles.
process.env.EXPO_PUBLIC_WEB_SAME_ORIGIN = 'false';

require('./start-qr');
