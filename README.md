# سرح (Sarh)

سوق ومحتوى اجتماعي للمواشي والملاحم في السعودية — Backend (NestJS) + تطبيق موبايل (Expo) + لوحة إدارة + لوحة ملحمة.

## Architecture

| Component | Path | Role |
|-----------|------|------|
| API / Worker / Socket | `backend-nest/` | NestJS + Prisma + Redis/BullMQ + Socket.IO |
| Mobile app | `app/` | Expo React Native (iOS/Android) |
| Admin panel | `admin-panel/` | Next.js |
| Butcher dashboard | `butcher-dashboard/` | Next.js PWA |
| Production compose | `docker-compose.prod.yml` | Postgres 18, Redis, api, worker, socket, nginx |
| Hostinger ops | `scripts/hostinger/` | Deploy, SSL, backup, restore, verify |

**Production host:** Hostinger VPS (`sarhsa.online`). Do **not** treat Render/Railway as current production.

```
Internet → nginx (:80/:443) → api:3001 (/api, /uploads)
                            → socket:3002 (/socket.io)
api/worker/socket → postgres + redis (internal Docker network)
```

## Requirements

- Node.js 22+
- Docker + Docker Compose (production)
- PostgreSQL 18 (prod image) / 16+ for local
- Redis 7+
- Expo / EAS for mobile builds

## Installation (local)

```bash
# Backend
cd backend-nest
cp .env.example .env   # fill secrets
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev

# Mobile
cd app
npm ci
npx expo start

# Admin / Butcher dashboards
cd admin-panel && npm ci && npm run dev
cd butcher-dashboard && npm ci && npm run dev
```

Dev stack (optional):

```bash
docker compose up -d   # local postgres/redis/api roles — see docker-compose.yml
```

## Environment Variables

Never commit `.env` / `.env.production`.

- Backend template: `backend-nest/.env.example`
- Hostinger production template: `scripts/hostinger/env.production.example`
- Validate on VPS (masked): `./scripts/hostinger/validate-env.sh`

Production boot **fails fast** if critical vars are missing (JWT, DB, Twilio, NI payment keys, storage, Redis). See `backend-nest/src/config/validate-production-env.ts`.

### Critical groups

| Group | Examples |
|-------|----------|
| Database | `DATABASE_URL`, `DIRECT_URL`, `POSTGRES_*` |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET`, Twilio Verify |
| Payments | `NI_BASE_URL`, `NI_OUTLET_ID`, `NI_API_KEY`, `NI_WEBHOOK_SECRET` |
| Storage | `STORAGE_PROVIDER=cloudinary` + Cloudinary keys |
| Redis | `REDIS_ENABLED`, `REDIS_HOST`, `REDIS_PORT` |
| Optional | `SENTRY_DSN`, Firebase, Agora, Google OAuth client IDs |

## Database

- ORM: Prisma (`backend-nest/prisma/`)
- Migrations: `npx prisma migrate deploy` (API container entrypoint runs this)
- **Never** run `migrate reset` against production

## Development

```bash
cd backend-nest && npm run start:dev
cd backend-nest && npm run worker:start   # queues/cron
cd backend-nest && npm run socket:start   # realtime
```

## Testing

```bash
cd backend-nest
npm run lint
npm run test          # unit
npm run test:cov
npm run test:e2e
npm run build

cd app && npm test
cd admin-panel && npm run lint && npm run build
cd butcher-dashboard && npm test && npm run typecheck && npm run lint && npm run build
```

## Build

```bash
cd backend-nest && npm run build
cd app && npx eas-cli build --profile preview --platform android
```

## Production Deployment (Hostinger VPS)

1. Clone/pull to `/opt/sarh` (or `SARH_ROOT`)
2. Create `.env.production` from `scripts/hostinger/env.production.example`
3. `./scripts/hostinger/validate-env.sh`
4. `./scripts/hostinger/04-deploy.sh`
5. `./scripts/hostinger/05-verify.sh`
6. SSL (once DNS points here): `./scripts/hostinger/06-setup-ssl.sh`  
   Uses `docker-compose.prod.yml` + `docker-compose.prod.ssl.yml`

### Docker roles (`SERVICE_MODE`)

| Service | Mode | Process |
|---------|------|---------|
| api | `api` | HTTP API + migrations on start |
| worker | `worker` | BullMQ + cron + heartbeat |
| socket | `socket` | Socket.IO realtime |

All use `restart: unless-stopped`.

## Migrations

```bash
cd backend-nest
npx prisma migrate deploy
# or rely on API container entrypoint
```

## Monitoring

- Liveness: `GET /api/health` (DB required; returns checks for redis/queue/worker)
- Readiness: `GET /api/health/ready` (DB + Redis + queue + worker when Redis enabled)
- Nginx alias: `GET /health` → API health
- Sentry: set `SENTRY_DSN` (optional but recommended)
- GitHub keep-alive workflow pings `https://sarhsa.online/api/health`

## Backups

```bash
./scripts/hostinger/09-backup-postgres.sh
# cron example: scripts/hostinger/backup-cron.example
./scripts/hostinger/10-restore-postgres.sh /path/to/dump   # requires typing RESTORE
```

Backups are local custom-format dumps + SHA256 + retention. Configure off-site sync (rclone/S3) for real disaster recovery — see comments in `backup-cron.example`.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| App won't start | Startup validation message listing missing env keys |
| OTP always fails | Twilio env + `DEV_OTP` must not be set in production |
| Payments stuck | `NI_*` keys, webhook signature, worker running, `/api/health` `checks.worker` |
| 429 on comments | Client dedupe + rate limits; avoid hammering listing detail |
| SSL ACME fail | DNS A record → VPS IP; webroot `/var/www/certbot` shared with nginx |
| Redis OOM | Compose sets `maxmemory 256mb` + `noeviction` |

### Common Errors

- `Application startup validation failed` — fill `.env.production`
- `missing_signature` on payment webhook — send `x-signature` / `x-ni-signature`
- `otp_misconfigured` — Twilio not configured in production

## Project Structure

```
sarh.app/
  backend-nest/     NestJS API, worker, socket, Prisma
  app/              Expo mobile client
  admin-panel/      Admin UI
  butcher-dashboard/ Butcher ops UI
  nginx/            Production reverse proxy configs
  scripts/hostinger/ VPS deploy / SSL / backup
  docker-compose.prod.yml
  docker-compose.prod.ssl.yml
  docs/             Extra docs
```

## License / Ops notes

Production domain: **https://sarhsa.online**  
Stack ownership: Hostinger VPS + EAS (mobile) + Cloudinary + Twilio + Network International (N-Genius).
