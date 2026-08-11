/**
 * Apply IBM Plex Sans Arabic + default Arabic RTL reading direction for Text / TextInput.
 * Matches سياسة الاسترداد: text starts on the right unless a style explicitly opts out.
 */
import { Text, TextInput, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { appFont } from '@/constants/fonts';
import { isAppRtl } from '@/lib/rtl';

type AnyTextProps = {
  style?: StyleProp<TextStyle>;
  [key: string]: unknown;
};

function resolveFontFamily(weight: TextStyle['fontWeight'] | undefined, existingFamily?: string): string {
  // Preserve explicit IBM Plex / app font families already set via typography tokens.
  if (existingFamily && Object.values(appFont).includes(existingFamily as (typeof appFont)[keyof typeof appFont])) {
    return existingFamily;
  }
  if (weight == null) return appFont.regular;
  const w = String(weight);
  if (w === '700' || w === '800' || w === '900' || w === 'bold') return appFont.semibold;
  if (w === '600' || w === 'semibold') return appFont.semibold;
  if (w === '500' || w === 'medium') return appFont.medium;
  return appFont.regular;
}

function withAppTextDefaults(style: StyleProp<TextStyle> | undefined): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const family = resolveFontFamily(flat?.fontWeight, flat?.fontFamily);
  const defaults: TextStyle = { fontFamily: family };

  // Explicit LTR fields (phones, emails, numbers) keep their own direction/align.
  const explicitLtr = flat?.writingDirection === 'ltr';

  if (!explicitLtr && isAppRtl()) {
    if (flat?.writingDirection == null) {
      defaults.writingDirection = 'rtl';
    }
    // Only fill missing align — preserve center / left overrides.
    if (flat?.textAlign == null) {
      defaults.textAlign = 'right';
    }
  }

  return [defaults, style];
}

let applied = false;

function patchHost(
  Component: { render?: (props: AnyTextProps, ref: unknown) => unknown; defaultProps?: AnyTextProps },
  bindTarget: unknown,
) {
  if (typeof Component.render === 'function') {
    const original = Component.render.bind(bindTarget);
    Component.render = (props: AnyTextProps, ref: unknown) =>
      original({ ...props, style: withAppTextDefaults(props.style as StyleProp<TextStyle>) }, ref);
    return;
  }
  Component.defaultProps = {
    ...Component.defaultProps,
    style: withAppTextDefaults(Component.defaultProps?.style as StyleProp<TextStyle>),
  };
}

/** Call once after fonts are available (safe to call multiple times). */
export function applyAppFonts() {
  if (applied) return;
  applied = true;
  patchHost(Text as unknown as { render?: (props: AnyTextProps, ref: unknown) => unknown; defaultProps?: AnyTextProps }, Text);
  patchHost(
    TextInput as unknown as { render?: (props: AnyTextProps, ref: unknown) => unknown; defaultProps?: AnyTextProps },
    TextInput,
  );
}
