'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Power, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/services/api.client';
import {
  OFFICIAL_SERVICE_CATEGORIES,
  createOfficialService,
  deleteOfficialService,
  fetchOfficialServicesAdmin,
  updateOfficialService,
  type OfficialServiceRecord,
} from '@/services/official-services.service';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'veterinary',
  icon: 'link-outline',
  externalUrl: '',
  active: true,
};

export default function OfficialServicesAdminPage() {
  const [services, setServices] = useState<OfficialServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setServices(await fetchOfficialServicesAdmin());
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر تحميل الخدمات'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEdit(service: OfficialServiceRecord) {
    setEditingId(service.id);
    setForm({
      title: service.title,
      description: service.description,
      category: service.category,
      icon: service.icon,
      externalUrl: service.externalUrl,
      active: service.active,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await updateOfficialService(editingId, form);
      } else {
        await createOfficialService(form);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر حفظ الخدمة'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="إدارة خدمات سرح"
        description="دليل الخدمات الرسمية — روابط خارجية فقط دون طلبات داخل التطبيق"
        actions={
          <Button variant="ghost" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
      >
        <h3 className="mb-3 font-semibold text-white">
          {editingId ? 'تعديل خدمة' : 'إضافة خدمة'}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="اسم الخدمة"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            {OFFICIAL_SERVICE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            placeholder="الأيقونة (مثل medical-outline)"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            required
          />
          <input
            placeholder="الرابط الرسمي"
            value={form.externalUrl}
            onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            required
            dir="ltr"
          />
          <textarea
            placeholder="الوصف"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-[96px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2"
            required
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            مفعّلة في التطبيق
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <Button type="submit" disabled={busy}>
            <Plus className="h-4 w-4" />
            {editingId ? 'حفظ التعديل' : 'إضافة الخدمة'}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              إلغاء
            </Button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <p className="text-slate-400">جاري التحميل...</p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{service.title}</p>
                    <span
                      className={
                        service.active
                          ? 'rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-300'
                          : 'rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400'
                      }
                    >
                      {service.active ? 'مفعّلة' : 'متوقفة'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {OFFICIAL_SERVICE_CATEGORIES.find((c) => c.value === service.category)?.label
                      ?? service.category}
                    · {service.icon}
                  </p>
                  <p className="mt-2 text-sm text-slate-300 line-clamp-2">{service.description}</p>
                  <a
                    href={service.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block truncate text-xs text-emerald-400"
                    dir="ltr"
                  >
                    {service.externalUrl}
                  </a>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(service)}>
                    <Pencil className="h-4 w-4" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await updateOfficialService(service.id, { active: !service.active });
                        await load();
                      } catch (err) {
                        setError(getApiErrorMessage(err, 'تعذر تحديث الحالة'));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Power className="h-4 w-4" />
                    {service.active ? 'إيقاف' : 'تفعيل'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (!confirm('حذف هذه الخدمة؟')) return;
                      setBusy(true);
                      try {
                        await deleteOfficialService(service.id);
                        await load();
                      } catch (err) {
                        setError(getApiErrorMessage(err, 'تعذر الحذف'));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
