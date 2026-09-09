import { applyThemeScheme } from '@/constants/theme';
import { colors, functional } from '@/design-system';
import {
  SURFACE_TONE,
  resolveAppTextStyle,
  resolveSarhButtonColors,
  resolveSarhCardStyle,
} from '@/design-system/components/resolvers';

describe('theme runtime Light ↔ Dark sync', () => {
  afterEach(() => {
    applyThemeScheme('dark');
  });

  it('updates design-system surfaces and text through a full toggle cycle', () => {
    applyThemeScheme('light');
    expect(colors.background).toBe('#F5F7F9');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.textPrimary).toBe('#101820');
    expect(SURFACE_TONE.background).toBe('#F5F7F9');
    expect(resolveSarhCardStyle('default', 'none').backgroundColor).toBe('#FFFFFF');
    expect(resolveAppTextStyle({ color: 'textPrimary' }).color).toBe('#101820');
    expect(functional.onPrimaryInverse).toBe('#F5F7F9');
    expect(resolveSarhButtonColors('primary', 'default').backgroundColor).toBe('#20B66F');
    expect(resolveSarhButtonColors('primary', 'default').contentColor).toBe('#FFFFFF');
    expect(colors.primary).toBe('#20B66F');
    expect(colors.success).toBe('#20B66F');

    applyThemeScheme('dark');
    expect(colors.background).toBe('#07131C');
    expect(colors.surface).toBe('#0C1C27');
    expect(colors.textPrimary).toBe('#F4F7F9');
    expect(SURFACE_TONE.background).toBe('#07131C');
    expect(resolveSarhCardStyle('default', 'none').backgroundColor).toBe('#0C1C27');
    expect(resolveAppTextStyle({ color: 'textPrimary' }).color).toBe('#F4F7F9');
    expect(resolveSarhButtonColors('primary', 'default').backgroundColor).toBe('#FFFFFF');
    expect(resolveSarhButtonColors('primary', 'default').contentColor).toBe('#07131C');
    expect(colors.primary).toBe('#20B66F');
    expect(colors.success).toBe('#20B66F');

    applyThemeScheme('light');
    expect(colors.background).toBe('#F5F7F9');
    expect(resolveSarhCardStyle('elevated', 'none').backgroundColor).toBe('#FFFFFF');

    applyThemeScheme('dark');
    expect(colors.background).toBe('#07131C');
    expect(resolveSarhCardStyle('elevated', 'none').backgroundColor).toBe('#102633');
  });
});
