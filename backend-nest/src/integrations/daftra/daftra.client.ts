import { DaftraClient } from './daftra.http-client';
import { DAFTRA_PATHS } from './daftra.constants';
import { DaftraRequestError, isDaftraRequestError } from './daftra.errors';

export type DaftraAccountConfig = {
  accountIdentifier: string;
  apiKey: string;
};

export type DaftraConnectionResult =
  | { connected: true; httpStatus: number }
  | {
      connected: false;
      reason: 'INVALID_API_KEY' | 'CONNECTION_FAILED';
      httpStatus: number | null;
      safeReason: string;
    };

const ACCOUNT_ID_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

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

export function resolveDaftraOrigin(accountIdentifier: string): string {
  const id = assertValidDaftraAccountIdentifier(accountIdentifier);
  const template = process.env.DAFTRA_API_BASE_URL?.trim();
  if (
    template &&
    (template.includes('{account}') || template.includes('{subdomain}'))
  ) {
    return template
      .replaceAll('{account}', id)
      .replaceAll('{subdomain}', id)
      .replace(/\/$/, '');
  }
  return `https://${id}.daftra.com`;
}

export function daftraApiOrigin(accountIdentifier: string): string {
  return resolveDaftraOrigin(accountIdentifier);
}

export function daftraApiKeyInfoUrl(accountIdentifier: string): string {
  return `${resolveDaftraOrigin(accountIdentifier)}/api2${DAFTRA_PATHS.apiKeyInfo}`;
}

export function createDaftraClient(
  config: DaftraAccountConfig,
  fetchImpl?: typeof fetch,
): DaftraClient {
  if (!config.apiKey?.trim()) {
    throw new DaftraRequestError(
      'INVALID_API_KEY',
      'بيانات اعتماد دفترة غير صحيحة',
      null,
    );
  }
  return new DaftraClient({
    origin: resolveDaftraOrigin(config.accountIdentifier),
    apiKey: config.apiKey,
    fetchImpl,
  });
}

export async function testDaftraConnection(
  config: DaftraAccountConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<DaftraConnectionResult> {
  try {
    const client = createDaftraClient(config, fetchImpl);
    const res = await client.get(DAFTRA_PATHS.apiKeyInfo);
    return { connected: true, httpStatus: res.httpStatus };
  } catch (err) {
    if (isDaftraRequestError(err)) {
      const reason =
        err.reason === 'INVALID_API_KEY'
          ? 'INVALID_API_KEY'
          : 'CONNECTION_FAILED';
      return {
        connected: false,
        reason,
        httpStatus: err.httpStatus,
        safeReason: err.safeMessage,
      };
    }
    return {
      connected: false,
      reason: 'CONNECTION_FAILED',
      httpStatus: null,
      safeReason: 'تعذر الاتصال بحساب دفترة',
    };
  }
}
