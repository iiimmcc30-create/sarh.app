export const EXPLORE_BANNER_AUTO_PLAY_MS = 5000;

export function nextExploreBannerIndex(current: number, count: number): number {
  if (count < 1) return 0;
  return (current + 1) % count;
}

export function shouldAutoPlayExploreBanners(count: number): boolean {
  return count >= 2;
}
