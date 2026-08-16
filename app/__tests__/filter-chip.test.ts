import { FILTER_CHIP } from '../components/ui/filterChipTokens';

describe('FilterChip tokens', () => {
  it('keeps a fixed height and content-driven horizontal padding', () => {
    expect(FILTER_CHIP.height).toBeGreaterThanOrEqual(44);
    expect(FILTER_CHIP.height).toBeLessThanOrEqual(48);
    expect(FILTER_CHIP.paddingHorizontal).toBeGreaterThanOrEqual(20);
    expect(FILTER_CHIP.paddingHorizontal).toBeLessThanOrEqual(24);
    expect(FILTER_CHIP.radius).toBeGreaterThanOrEqual(14);
    expect(FILTER_CHIP.radius).toBeLessThanOrEqual(16);
    expect(FILTER_CHIP.gap).toBeGreaterThanOrEqual(8);
    expect(FILTER_CHIP.gap).toBeLessThanOrEqual(12);
  });

  it('uses a dark idle surface near the messages reference', () => {
    expect(FILTER_CHIP.idleSurfaceFallback.toLowerCase()).toBe('#101f2c');
  });

  it('keeps the official chip radius near the market reference', () => {
    expect(FILTER_CHIP.radius).toBeGreaterThanOrEqual(12);
    expect(FILTER_CHIP.radius).toBeLessThanOrEqual(16);
  });
});
