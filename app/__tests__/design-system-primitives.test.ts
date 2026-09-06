import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { sarh } from '@/constants/sarhTokens';
import { colors as liveThemeColors } from '@/constants/theme';
import { colors, FONT_WEIGHT_MIGRATION, fontFamily, fontWeight, typography } from '@/design-system';
import {
  APP_TEXT_COLOR,
  AVATAR_SIZE,
  CARD_PADDING,
  ICON_BUTTON_SIZE,
  SURFACE_TONE,
  avatarInitials,
  resolveAppTextStyle,
  resolveSarhBadgeColors,
  resolveSarhButtonColors,
  resolveSarhCardStyle,
  resolveSarhChipColors,
  resolveSarhIconButtonColors,
  resolveSarhInputBorder,
} from '@/design-system/components/resolvers';

const COMPONENTS_DIR = path.join(__dirname, '../design-system/components');

function componentFiles() {
  return readdirSync(COMPONENTS_DIR)
    .filter((name) => name.endsWith('.tsx') && name !== 'index.ts')
    .map((name) => ({
      name,
      src: readFileSync(path.join(COMPONENTS_DIR, name), 'utf8'),
    }));
}

describe('core UI primitives', () => {
  it('maps AppText variants to real IBM Plex weights', () => {
    expect(resolveAppTextStyle({ variant: 'display' })).toMatchObject({
      fontFamily: fontFamily.bold,
      fontWeight: fontWeight.bold,
      fontSize: 28,
    });
    expect(resolveAppTextStyle({ variant: 'heading2' })).toMatchObject({
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
    });
    expect(resolveAppTextStyle({ variant: 'label' })).toMatchObject({
      fontFamily: fontFamily.medium,
      fontWeight: '500',
    });
    expect(resolveAppTextStyle({ variant: 'body' })).toMatchObject({
      fontFamily: fontFamily.regular,
      fontWeight: '400',
      fontSize: typography.body.fontSize,
    });
    expect(resolveAppTextStyle({ variant: 'caption', color: 'textMuted' }).color).toBe(
      colors.textMuted,
    );
    expect(APP_TEXT_COLOR.danger).toBe(colors.danger);
  });

  it('keeps button / chip / badge colors on design tokens', () => {
    expect(resolveSarhButtonColors('primary', 'default').backgroundColor).toBe(colors.primary);
    expect(resolveSarhButtonColors('primary', 'pressed').backgroundColor).toBe(colors.primaryPressed);
    expect(resolveSarhButtonColors('danger', 'default').backgroundColor).toBe(colors.danger);
    expect(resolveSarhButtonColors('ghost', 'default').backgroundColor).toBe('transparent');
    expect(resolveSarhChipColors(true).backgroundColor).toBe(colors.primary);
    expect(resolveSarhChipColors(false).borderColor).toBe(colors.border);
    expect(resolveSarhBadgeColors('danger').color).toBe('danger');
    expect(resolveSarhInputBorder('error')).toBe(colors.danger);
    expect(resolveSarhInputBorder('focused')).toBe(colors.primary);
    expect(resolveSarhIconButtonColors('selected').backgroundColor).toBe(colors.primary);
  });

  it('uses surface / radius / elevation tokens on cards and surfaces', () => {
    expect(resolveSarhCardStyle('elevated', 'md').backgroundColor).toBe(colors.surfaceElevated);
    expect(resolveSarhCardStyle('outlined', 'none').padding).toBe(CARD_PADDING.none);
    expect(resolveSarhCardStyle('default', 'lg').borderRadius).toBe(16);
    expect(SURFACE_TONE.background).toBe(colors.background);
    expect(SURFACE_TONE.surfaceAlt).toBe(colors.surfaceAlt);
    expect(ICON_BUTTON_SIZE.sm.box).toBeGreaterThanOrEqual(44);
    expect(AVATAR_SIZE.md).toBe(40);
    expect(avatarInitials('محمد علي')).toBe('مع');
  });

  it('declares accessibility roles on interactive primitives', () => {
    for (const file of componentFiles()) {
      if (/(Button|Chip|Input)/.test(file.name)) {
        expect(file.src).toMatch(/accessibilityRole|accessibilityLabel|accessibilityState/);
      }
    }
    const button = readFileSync(path.join(COMPONENTS_DIR, 'SarhButton.tsx'), 'utf8');
    expect(button).toContain('accessibilityRole="button"');
    expect(button).toContain('accessibilityState');
    expect(button).toContain('loading');
    expect(button).toContain('disabled');
    const input = readFileSync(path.join(COMPONENTS_DIR, 'SarhInput.tsx'), 'utf8');
    expect(input).toContain('rtlInputText');
    expect(input).toContain('errorText');
    const text = readFileSync(path.join(COMPONENTS_DIR, 'AppText.tsx'), 'utf8');
    const resolvers = readFileSync(path.join(COMPONENTS_DIR, 'resolvers.ts'), 'utf8');
    expect(resolvers).toContain('getRtlText()');
    expect(text).toContain('allowFontScaling');
    expect(text).not.toContain("textAlign: 'right'");
  });

  it('forbids raw hex and ad-hoc sizes inside new primitives', () => {
    const files = [
      ...componentFiles(),
      {
        name: 'resolvers.ts',
        src: readFileSync(path.join(COMPONENTS_DIR, 'resolvers.ts'), 'utf8'),
      },
    ];
    for (const file of files) {
      expect(file.src).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(file.src).not.toMatch(/fontSize=\{1[0-9]\}/);
      expect(file.src).not.toMatch(/borderRadius=\{1[0-9]\}/);
      expect(file.src).not.toMatch(/duration=\{250\}/);
    }
  });

  it('unifies live theme danger/warning with sarh.color', () => {
    expect(liveThemeColors.danger).toBe(sarh.color.danger);
    expect(liveThemeColors.warning).toBe(sarh.color.warning);
    expect(liveThemeColors.danger).toBe('#E85D5D');
    expect(liveThemeColors.warning).toBe('#D4A017');
    expect(liveThemeColors.rose).toBe('#F43F5E');
    expect(liveThemeColors.amber).toBe('#FBBF24');
    expect(colors.danger).toBe(sarh.color.danger);
    expect(colors.warning).toBe(sarh.color.warning);
  });

  it('documents leftover Bold remapping instead of rewriting screens', () => {
    expect(FONT_WEIGHT_MIGRATION.join(' ')).toContain('AppText.tsx');
    expect(FONT_WEIGHT_MIGRATION.join(' ')).toContain('theme.ts');
  });

  it('pilots primitives only on the support help screen', () => {
    const help = readFileSync(path.join(__dirname, '../app/support/help.tsx'), 'utf8');
    expect(help).toContain("from '@/design-system/components'");
    expect(help).toContain('<AppText variant="heading3"');
    expect(help).toContain('<SarhButton');
    expect(help).toContain('<SarhCard');
    expect(help).toContain('<SarhInput');
    expect(help).not.toContain('PrimaryButton');
    expect(help).not.toContain('AppTextInput');
    expect(help).not.toContain('GlassCard');
  });
});
