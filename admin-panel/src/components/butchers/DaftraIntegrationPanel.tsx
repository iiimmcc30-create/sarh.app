'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getStoredUser } from '@/services/auth.service';
import {
  disableDaftra,
  fetchDaftraStatus,
  saveDaftraConfig,
  testDaftraConnection,
  type DaftraStatus,
} from '@/services/admin.service';

const STATUS_LABELS: Record<DaftraStatus['status'], string> = {
  NOT_CONFIGURED: 'غير معدّ',
  CONNECTED: 'متصل',
  CONNECTION_FAILED: 'فشل الاتصال',
  DISABLED: 'معطّل',
};

const STATUS_TONE: Record<DaftraStatus['status'], 'default' | 'success' | 'warning' | 'danger'> = {
  NOT_CONFIGURED: 'default',
  CONNECTED: 'success',
  CONNECTION_FAILED: 'danger',
  DISABLED: 'warning',
};

export function DaftraIntegrationPanel({ butcherId }: { butcherId: string }) {
  const isAdmin = getStoredUser()?.role === 'ADMIN';
  const [status, setStatus] = useState<DaftraStatus | null>(null);
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [sendInvite, setSendInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchDaftraStatus(butcherId);
      setStatus(data);
      setAccountIdentifier(data.accountIdentifier ?? '');
      setLoginEmail(data.daftraLoginEmail ?? '');
      setLoginUrl(data.daftraLoginUrl ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل تكامل دفترة');
    }
  }, [butcherId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAdmin) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-2 font-semibold text-white">تكامل دفترة</h3>
        <p className="text-sm text-slate-500">إعداد دفترة متاح للمسؤول فقط.</p>
      </section>
    );
  }

  const onSave = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await saveDaftraConfig(butcherId, {
        accountIdentifier,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        daftraLoginEmail: loginEmail.trim() || null,
        daftraLoginUrl: loginUrl.trim() || null,
      });
      setStatus(data);
      setApiKey('');
      setMessage('تم حفظ إعدادات دفترة.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const onTest = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await testDaftraConnection(butcherId, {
        sendInvite,
        ...(sendInvite && invitePassword.trim()
          ? { invitePassword: invitePassword.trim() }
          : {}),
      });
      setStatus(data.status);
      setInvitePassword('');
      setMessage(data.messageAr);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر اختبار الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const onDisable = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await disableDaftra(butcherId);
      setStatus(data);
      setMessage('تم تعطيل تكامل دفترة.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر التعطيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 lg:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-white">تكامل دفترة</h3>
        <Badge tone={STATUS_TONE[status?.status ?? 'NOT_CONFIGURED']}>
          {STATUS_LABELS[status?.status ?? 'NOT_CONFIGURED']}
        </Badge>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        جهّز حساب دفترة يدوياً ثم أدخل معرّف الحساب ومفتاح API. لا تُخزَّن كلمة مرور دفترة في سرح.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-400">
          معرّف الحساب / Subdomain
          <input
            value={accountIdentifier}
            onChange={(e) => setAccountIdentifier(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            placeholder="account"
          />
        </label>
        <label className="text-sm text-slate-400">
          مفتاح API
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            placeholder={status?.apiKeyMasked ?? 'لن يظهر بعد الحفظ'}
            autoComplete="new-password"
          />
        </label>
        <label className="text-sm text-slate-400">
          بريد دخول دفترة (للإرسال فقط)
          <input
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            placeholder="butcher@example.com"
          />
        </label>
        <label className="text-sm text-slate-400">
          رابط دخول دفترة
          <input
            value={loginUrl}
            onChange={(e) => setLoginUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            placeholder="https://account.daftra.com"
          />
        </label>
      </div>
      {status?.apiKeyMasked ? (
        <p className="mt-2 text-xs text-slate-500">المفتاح المحفوظ: {status.apiKeyMasked}</p>
      ) : null}
      {status?.lastConnectionTestAt ? (
        <p className="mt-1 text-xs text-slate-500">آخر اختبار: {new Date(status.lastConnectionTestAt).toLocaleString('ar-SA')}</p>
      ) : null}
      {status?.lastConnectionError ? (
        <p className="mt-1 text-xs text-rose-400">{status.lastConnectionError}</p>
      ) : null}
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <input
          type="checkbox"
          checked={sendInvite}
          onChange={(e) => setSendInvite(e.target.checked)}
        />
        إرسال بريد الدخول بعد نجاح الاختبار (بدون مفتاح API)
      </label>
      {sendInvite ? (
        <label className="mt-2 block text-sm text-slate-400">
          كلمة مرور مؤقتة (اختيارية — تُرسل مرة واحدة ولا تُحفظ)
          <input
            type="password"
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            autoComplete="new-password"
          />
        </label>
      ) : null}
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={loading} onClick={onSave}>
          حفظ الإعدادات
        </Button>
        <Button variant="secondary" disabled={loading} onClick={onTest}>
          اختبار اتصال دفترة
        </Button>
        <Button variant="danger" disabled={loading || !status?.configured} onClick={onDisable}>
          تعطيل
        </Button>
      </div>
    </section>
  );
}
