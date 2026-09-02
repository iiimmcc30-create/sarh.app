# Daftra integration (Sarh)

```
Butcher
  └── ButcherDaftraIntegration (subdomain + AES-256-GCM API key)
        └── DaftraClient  →  https://{account}.daftra.com/api2
              ├── GET /api_key_info.json
              ├── GET /products.json
              ├── GET /products/{id}.json
              ├── POST /products.json   (client helper, not Sarh catalog CRUD)
              └── PUT  /products/{id}.json
```

## Secrets

- Per-butcher API key is stored in `ButcherDaftraIntegration` (`apiKeyCiphertext`, `apiKeyIv`, `apiKeyTag`).
- Encrypt/decrypt: `src/common/crypto/secret-encryption.ts` (AES-256-GCM).
- Key material: `SECRETS_ENCRYPTION_KEY` or a derived key from `JWT_SECRET`.
- The key is never returned to the frontend (masked last4 only), never emailed, and never logged.

## Client creation

`DaftraService.clientForButcher(butcherId)`:

1. Load the butcher row (404 if missing).
2. Load **that butcher’s** integration only (`where: { butcherId }`).
3. Decrypt the key in-process.
4. Build `DaftraClient` with `https://{accountIdentifier}.daftra.com`.

Callers never pass `apiKey` or `subdomain` from the client for data requests.

## Tenant isolation

- Butcher routes resolve the shop from `JWT.userId` → `Butcher.userId`.
- Admin routes take `butcherId` from the path and still load integration by that id only.
- `Butcher A` cannot decrypt or call with `Butcher B` credentials.
- Product links are unique on `(butcherId, daftraProductId)` and a Sarh product is verified to belong to the same butcher before linking.

## Connection test

`GET /api2/api_key_info.json` with header `APIKEY` (no `Authorization`, no body `Content-Type`).

- Host: `https://{accountIdentifier}.daftra.com` — use the **subdomain** (e.g. `sarh-app`), not the numeric Account ID.
- Success: `{ connected: true }`.
- Auth failure: `{ connected: false, reason: "INVALID_API_KEY", httpStatus: 401 }`.
- Network/timeout: `CONNECTION_FAILED` (`httpStatus: null`).
- Logs include `reason`, `httpStatus`, and `host` — never the API key.

## Caching

`daftra.cache.ts` defines tenant-prefixed keys (`daftra:{butcherId}:…`) for a later Redis cache. Reads currently go straight to Daftra with a 12s timeout. Do not cache across butcher ids.

## Adding a Daftra endpoint

1. Add the documented path to `daftra.constants.ts` (`DAFTRA_PATHS`).
2. Call it only through `DaftraClient` (`get/post/put/patch/delete`).
3. Map the JSON in `daftra.mappers.ts` — do not leak raw Daftra payloads (especially `data.key`).
4. Expose it from `DaftraService` after `clientForButcher`.

## Sarh HTTP routes

Admin (ADMIN only):

- `GET/PUT /api/admin/butchers/:id/daftra`
- `POST /api/admin/butchers/:id/daftra/test`
- `POST /api/admin/butchers/:id/daftra/disable`
- `GET /api/admin/butchers/:id/daftra/products`
- `GET /api/admin/butchers/:id/daftra/products/:productId`
- `GET /api/admin/butchers/:id/daftra/inventory`

Butcher (JWT owner shop only):

- `GET /api/butchers/daftra/status`
- `POST /api/butchers/daftra/test-connection`
- `GET /api/butchers/daftra/products`
- `GET /api/butchers/daftra/products/:id`
- `GET /api/butchers/daftra/inventory`
- `GET /api/butchers/daftra/inventory/:id`
- `GET/POST /api/butchers/daftra/product-links`

`POST/PUT` Daftra product helpers exist on `DaftraService` for a later catalog flow and are **not** wired to Sarh `ButcherProduct` CRUD.

## Inventory note

No dedicated Daftra “list inventory” API2 path was found in the available docs. List inventory uses documented `Product.stock_balance` on `GET /products.json`. Per-product warehouse splits use `StockLevels` on `GET /products/{id}.json` when present.
