import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { resolveDevServiceUrl, RAILWAY_API } from './devHost';

function usesSameOriginWebApi(): boolean {
  if (Platform.OS !== 'web') return false;
  if (process.env.EXPO_PUBLIC_WEB_SAME_ORIGIN === 'true') return true;
  return !__DEV__;
}

function resolveApiBase(): string {
  if (usesSameOriginWebApi()) {
    return '';
  }
  return resolveDevServiceUrl(process.env.EXPO_PUBLIC_API_URL, 3001);
}

export let API_BASE = resolveApiBase();

let reachabilityChecked = false;

async function probeApiHealth(baseUrl: string, timeoutMs = 4000): Promise<boolean> {
  if (!baseUrl) return true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/** Dev-only: switch to Railway when the configured API is unreachable. */
export async function ensureApiReachable(): Promise<string> {
  if (!__DEV__ || usesSameOriginWebApi()) {
    return API_BASE;
  }
  if (reachabilityChecked) {
    return API_BASE;
  }
  reachabilityChecked = true;

  if (await probeApiHealth(API_BASE)) {
    return API_BASE;
  }

  if (!API_BASE.includes('railway.app') && (await probeApiHealth(RAILWAY_API))) {
    console.warn('[سرح] Local API unreachable — switched to Railway');
    API_BASE = RAILWAY_API;
  }

  return API_BASE;
}

if (__DEV__) {
  console.log('[سرح] API_BASE =', API_BASE);
  console.log('[سرح] Metro host =', Constants.expoConfig?.hostUri ?? 'n/a');
  if (API_BASE.includes('127.0.0.1')) {
    console.log('[سرح] USB — إذا فشل الاتصال: npm run adb:reverse (أو أعدي تشغيل Metro)');
  }
  if (API_BASE.includes('railway.app')) {
    console.log('[سرح] API → Railway (بيانات الإنتاج)');
  }
}

export { RAILWAY_API };
