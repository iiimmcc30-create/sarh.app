import { readFileSync } from 'fs';
import path from 'path';
import {
  applyThemeScheme,
  colors,
  getActiveScheme,
  snapshotTheme,
} from '@/constants/theme';
import { resolveSarhButtonColorsForScheme } from '@/design-system/components/resolvers';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

describe('market listing card height', () => {
  it('keeps the list thumb a fixed square so the row cannot grow with the text column', () => {
    const card = src('components/feature/ListingCard.tsx');
    expect(card).toContain('aspectRatio: 1');
    expect(card).toContain("alignItems: 'flex-start'");
    expect(card).not.toContain('minHeight: 118');
    expect(card).not.toContain("alignSelf: 'stretch'");
    expect(card).not.toContain('flexGrow: 1');
  });
});

describe('butcher theme isolation', () => {
  afterEach(() => {
    applyThemeScheme('dark');
  });

  it('scopes light butcher chrome without flipping the live app scheme', () => {
    const layout = src('app/butchers/_layout.tsx');
    expect(layout).toContain('ButcherThemeScope');
    expect(layout).not.toContain('setSchemeOverride');
    expect(layout).not.toContain('useFocusEffect');
    expect(layout).not.toContain('applyThemeScheme');

    const scope = src('contexts/ButcherThemeScope.tsx');
    expect(scope).toContain("scheme: 'light'");
    expect(scope).toContain('snapshotTheme');
    expect(scope).not.toContain('applyThemeScheme');
    expect(scope).toContain('setSchemeOverride: () => {}');
  });

  it('keeps the root navigator wrapper stable across Light and Dark', () => {
    const rootLayout = src('app/_layout.tsx');
    expect(rootLayout).toContain('<SarhPatternBackground>{stack}</SarhPatternBackground>');
    expect(rootLayout).not.toContain('return stack');
  });

  it('snapshots light colors without mutating the live dark theme', () => {
    applyThemeScheme('dark');
    const before = colors.textPrimary;
    const snap = snapshotTheme('light');
    expect(snap.colors.textPrimary).toBe('#101820');
    expect(snap.colors.screenRoot).toBe('#F5F7F9');
    expect(colors.textPrimary).toBe(before);
    expect(getActiveScheme()).toBe('dark');
    expect(resolveSarhButtonColorsForScheme('light', 'primary', 'default').backgroundColor).toBe(
      '#20B66F',
    );
    expect(resolveSarhButtonColorsForScheme('dark', 'primary', 'default').backgroundColor).toBe(
      '#FFFFFF',
    );
  });
});
