import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const APP_SCHEME = 'safat';

/** Return deep link used after Network International hosted checkout. */
export function paymentResultDeepLink(params: Record<string, string> = {}): string {
  const base = `${APP_SCHEME}://payment/result`;
  const entries = Object.entries(params).filter(([, value]) => value.length > 0);
  if (entries.length === 0) return base;
  const qs = new URLSearchParams(Object.fromEntries(entries)).toString();
  return `${base}?${qs}`;
}

/**
 * Open NI checkout and prefer an in-app auth session that returns via deep link.
 * Falls back to the system browser if the auth session is unavailable.
 */
export async function openPaymentCheckout(
  checkoutUrl: string,
  returnParams: Record<string, string> = {},
): Promise<'success' | 'cancel' | 'dismiss'> {
  const returnUrl = paymentResultDeepLink({ ...returnParams, gatewayReturn: '1' });
  try {
    const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
    if (result.type === 'success') return 'success';
    if (result.type === 'cancel') return 'cancel';
    return 'dismiss';
  } catch {
    try {
      await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch {
      await Linking.openURL(checkoutUrl);
    }
    return 'dismiss';
  }
}
