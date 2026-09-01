export type DaftraAccountConfig = {
  accountIdentifier: string;
  apiKey: string;
};

export type DaftraConnectionResult =
  | { ok: true; httpStatus: number }
  | { ok: false; httpStatus: number | null; safeReason: string };

const ACCOUNT_ID_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const REQUEST_TIMEOUT_MS = 12_000;

export function normalizeDaftraAccountIdentifier(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return '';
  const withoutProto = trimmed.replace(/^https?:\/\//, '');
  const host = withoutProto.split('/')[0] ?? '';
  if (host.includes('.')) {
    const parts = host.split('.').filter(Boolean);
    if (parts.length >= 2 && parts[parts.length - 2] === 'daftra') {
      return parts[0] ?? '';
    }
    throw new Error('invalid_account_identifier');
  }
  return host;
}

export function assertValidDaftraAccountIdentifier(value: string): string {
  const normalized = normalizeDaftraAccountIdentifier(value);
  if (!ACCOUNT_ID_RE.test(normalized)) {
    throw new Error('invalid_account_identifier');
  }
  return normalized;
}

export function daftraApiOrigin(accountIdentifier: string): string {
  const id = assertValidDaftraAccountIdentifier(accountIdentifier);
  return `https://${id}.daftra.com`;
}

/** Test-only endpoint: API key info. Does not sync products or inventory. */
export function daftraApiKeyInfoUrl(accountIdentifier: string): string {
  return `${daftraApiOrigin(accountIdentifier)}/api2/api_key_info.json`;
}

function safeFailureReason(httpStatus: number | null): string {
  if (httpStatus === 401 || httpStatus === 403) {
    return 'بيانات اعتماد دفترة غير صحيحة';
  }
  if (httpStatus === 404) {
    return 'تعذر الوصول لحساب دفترة';
  }
  if (httpStatus === 429) {
    return 'حساب دفترة رفض الطلب بسبب كثرة المحاولات';
  }
  if (httpStatus && httpStatus >= 500) {
    return 'خدمة دفترة غير متاحة حالياً';
  }
  if (httpStatus === null) {
    return 'تعذر الاتصال بحساب دفترة';
  }
  return 'تعذر الاتصال بحساب دفترة';
}

function stripSecretsFromUnknown(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(stripSecretsFromUnknown);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const lower = key.toLowerCase();
      if (
        lower.includes('key') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('authorization') ||
        lower.includes('apikey')
      ) {
        out[key] = '[redacted]';
      } else {
        out[key] = stripSecretsFromUnknown(nested);
      }
    }
    return out;
  }
  return value;
}

export async function testDaftraConnection(
  config: DaftraAccountConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<DaftraConnectionResult> {
  const url = daftraApiKeyInfoUrl(config.accountIdentifier);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        APIKEY: config.apiKey,
      },
      signal: controller.signal,
    });

    const httpStatus = response.status;
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { ok: false, httpStatus, safeReason: 'استجابة دفترة غير صالحة' };
    }

    void stripSecretsFromUnknown(body);

    if (httpStatus < 200 || httpStatus >= 300) {
      return {
        ok: false,
        httpStatus,
        safeReason: safeFailureReason(httpStatus),
      };
    }

    const record = body as { result?: unknown; code?: unknown };
    if (record.result === 'failed' || Number(record.code) === 401) {
      return {
        ok: false,
        httpStatus,
        safeReason: 'بيانات اعتماد دفترة غير صحيحة',
      };
    }
    if (record.result && record.result !== 'success') {
      return {
        ok: false,
        httpStatus,
        safeReason: 'تعذر التحقق من حساب دفترة',
      };
    }

    return { ok: true, httpStatus };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        httpStatus: null,
        safeReason: 'انتهت مهلة الاتصال بدفترة',
      };
    }
    return { ok: false, httpStatus: null, safeReason: safeFailureReason(null) };
  } finally {
    clearTimeout(timer);
  }
}
