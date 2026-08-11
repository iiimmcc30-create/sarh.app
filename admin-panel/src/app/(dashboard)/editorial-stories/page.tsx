'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Power, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/services/api.client';
import {
  createEditorialStory,
  deleteEditorialStory,
  fetchEditorialStoriesAdmin,
  updateEditorialStory,
  type EditorialStoryRecord,
} from '@/services/editorial-stories.service';

const EMPTY_FORM = {
  titleAr: '',
  bodyAr: '',
  imageUrl: '',
  duration: 20,
  sortOrder: 0,
  isActive: true,
};

export default function EditorialStoriesAdminPage() {
  const [stories, setStories] = useState<EditorialStoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStories(await fetchEditorialStoriesAdmin());
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر تحميل الستوريات'));
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

  function startEdit(story: EditorialStoryRecord) {
    setEditingId(story.id);
    setForm({
      titleAr: story.titleAr,
      bodyAr: story.bodyAr,
      imageUrl: story.imageUrl,
      duration: story.duration,
      sortOrder: story.sortOrder,
      isActive: story.isActive,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        titleAr: form.titleAr,
        bodyAr: form.bodyAr,
        imageUrl: form.imageUrl,
        duration: Number(form.duration) || 20,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingId) {
        await updateEditorialStory(editingId, payload);
      } else {
        await createEditorialStory(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر حفظ الستوري'));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(story: EditorialStoryRecord) {
    setBusy(true);
    setError(null);
    try {
      await updateEditorialStory(story.id, { isActive: !story.isActive });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر تحديث الحالة'));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('حذف هذا الستوري؟')) return;
    setBusy(true);
    setError(null);
    try {
      await deleteEditorialStory(id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر حذف الستوري'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="ستوريات الصفحة الرئيسية"
        description="صور إخبارية تظهر في شريط أفقي على الرئيسية — المدة الافتراضية 20 ثانية"
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
          {editingId ? 'تعديل ستوري' : 'إضافة ستوري'}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="العنوان"
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2"
            required
          />
          <input
            placeholder="رابط الصورة"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2"
            required
            dir="ltr"
          />
          <input
            type="number"
            min={5}
            max={60}
            placeholder="المدة (ثانية)"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            dir="ltr"
          />
          <input
            type="number"
            min={0}
            placeholder="ترتيب العرض"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            dir="ltr"
          />
          <textarea
            placeholder="نص المقال"
            value={form.bodyAr}
            onChange={(e) => setForm({ ...form, bodyAr: e.target.value })}
            className="min-h-[140px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2"
            required
          />
          <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            نشط (يظهر في التطبيق)
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={busy}>
            <Plus className="h-4 w-4" />
            {editingId ? 'حفظ التعديل' : 'إضافة'}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={resetForm} disabled={busy}>
              إلغاء
            </Button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">جاري التحميل…</p>
        ) : stories.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد ستوريات بعد</p>
        ) : (
          stories.map((story) => (
            <div
              key={story.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={story.imageUrl}
                alt=""
                className="h-28 w-20 shrink-0 rounded-xl object-cover bg-slate-800"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-white">{story.titleAr}</h4>
                  <span
                    className={
                      story.isActive
                        ? 'rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-300'
                        : 'rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400'
                    }
                  >
                    {story.isActive ? 'نشط' : 'متوقف'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {story.duration}ث · ترتيب {story.sortOrder}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{story.bodyAr}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  onClick={() => startEdit(story)}
                  disabled={busy}
                  aria-label="تعديل"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void toggleActive(story)}
                  disabled={busy}
                  aria-label="تفعيل/إيقاف"
                >
                  <Power className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void onDelete(story.id)}
                  disabled={busy}
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
