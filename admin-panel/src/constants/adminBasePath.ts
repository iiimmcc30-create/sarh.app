/** Empty in local/dev; `/admin` when the panel is served on sarhsa.online/admin. */
export const ADMIN_BASE_PATH = (
  process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ''
).replace(/\/$/, '');

export function withAdminBase(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!ADMIN_BASE_PATH) return p;
  if (p === '/') return `${ADMIN_BASE_PATH}/`;
  return `${ADMIN_BASE_PATH}${p}`;
}
