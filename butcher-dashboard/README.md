# سرح — لوحة الملاحم (Butcher Dashboard)

لوحة ويب مستقلة لصاحب الملحمة. ليست لوحة إدارة المنصة، وليست تطبيق الموبايل.

```text
Sarh Mobile        → المستخدم النهائي
butcher-dashboard  → صاحب الملحمة
admin-panel        → إدارة منصة سرح

الكل يتصل بـ:
NestJS API → Prisma → PostgreSQL
```

## التقنيات

| الطبقة | التقنية |
|--------|---------|
| Frontend | Next.js 14.2 App Router, TypeScript, Tailwind CSS 3.4, Axios |
| Backend | `backend-nest` الحالي فقط |
| Auth | `POST /api/auth/login` ثم `GET /api/butchers/me` |

لا تتصل اللوحة بقاعدة البيانات مباشرة.

## التشغيل المحلي

1. شغّل NestJS على المنفذ `3001`.
2. انسخ البيئة:

```bash
cd butcher-dashboard
cp .env.example .env.local
npm install
npm run dev
```

اللوحة تعمل على [http://localhost:3002](http://localhost:3002).

طلبات المتصفح تذهب إلى `/api/*` ويُعاد توجيهها من Next.js إلى NestJS (نفس أسلوب `admin-panel`) لتفادي CORS في التطوير.

## Authentication

1. المستخدم يسجّل الدخول عبر `POST /api/auth/login` (JWT الحالي).
2. اللوحة تستدعي `GET /api/butchers/me`.
3. الـ Backend يحدد الملحمة من `userId` داخل JWT، وليس من `butcherId` في الواجهة.
4. إن لم توجد ملحمة مرتبطة يُرفض الدخول وتُمسح الجلسة.

لا يُستخدم `/admin/auth/login`.

## Authorization (MVP)

صاحب الملحمة المرتبط بصف `Butcher` هو المستخدم الوحيد المسموح له. نظام الموظفين مؤجّل.

## Environment Variables

### `butcher-dashboard`

| المتغير | الغرض |
|---------|--------|
| `NEXT_PUBLIC_API_URL` | أصل NestJS لإعادة كتابة `/api` من السيرفر (الافتراضي `http://127.0.0.1:3001`) |

### `backend-nest`

| المتغير | الغرض |
|---------|--------|
| `BUTCHER_DASHBOARD_URL` | أصل اللوحة في الإنتاج إذا استدعت المتصفح الـ API مباشرة |
| `ALLOWED_ORIGINS` | قائمة CORS عامة |

في غير الإنتاج يُسمح تلقائيًا بـ `http://localhost:3002` و `http://127.0.0.1:3002`.

## Deployment

انشر Next.js (`output: standalone`) على نطاق منفصل عن لوحة الإدارة. أضف النطاق إلى `BUTCHER_DASHBOARD_URL` / `ALLOWED_ORIGINS` إن لم تستخدم reverse proxy لنفس أصل `/api`.

## المرحلة الحالية

Phase 1 — Foundation فقط: تسجيل الدخول، التحقق من الملحمة، الهيكل، الشريط الجانبي، الرأس، CORS.

صفحات الطلبات/المنتجات/المخزون/العملاء/التقارير/الإعدادات تظهر كصفحات انتظار بدون بيانات وهمية حتى المرحلة التالية.
