import { I18nManager, Platform, type TextStyle, type ViewStyle } from 'react-native';
import {
  DEFAULT_LOCALE,
  type AppLocale,
  localeUsesRtl,
  LOCALE_STORAGE_KEY,
  normalizeAppLocale,
} from '@/lib/locale';

/** Read layout direction from React Native (always fresh). */
export function isAppRtl(): boolean {
  return I18nManager.isRTL;
}

/** @deprecated Use `isAppRtl()` — kept for existing imports. */
export const isRTL = I18nManager.isRTL;

/**
 * Configure RTL/LTR via official I18nManager.
 * Call once before the app bundle renders (see `index.js`).
 */
export function setupRtl(locale: AppLocale = DEFAULT_LOCALE): void {
  const rtl = localeUsesRtl(locale);
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(rtl);
  if (Platform.OS !== 'web') {
    I18nManager.swapLeftAndRightInRTL(rtl);
  }
}

/** Apply stored locale on cold start (async). May require reload if direction changes. */
export async function setupRtlFromStorage(
  getItem: (key: string) => Promise<string | null>,
): Promise<AppLocale> {
  const stored = normalizeAppLocale(await getItem(LOCALE_STORAGE_KEY));
  setupRtl(stored);
  return stored;
}

const nativeRtlDirection =
  Platform.OS === 'web' ? ({ direction: 'rtl' } as ViewStyle) : ({ direction: 'rtl' } as ViewStyle);

const nativeLtrDirection =
  Platform.OS === 'web' ? ({ direction: 'ltr' } as ViewStyle) : ({} as ViewStyle);

/** Root / screen layout direction for the active locale. */
export const rtlDirection: ViewStyle = isAppRtl()
  ? Platform.OS === 'web'
    ? { direction: 'rtl' }
    : nativeRtlDirection
  : Platform.OS === 'web'
    ? { direction: 'ltr' }
    : nativeLtrDirection;

/** Horizontal row that respects layout direction (RTL Arabic vs LTR English). */
export const rtlRow: ViewStyle = isAppRtl()
  ? Platform.OS === 'web'
    ? { flexDirection: 'row-reverse' }
    : { flexDirection: 'row', ...nativeRtlDirection }
  : { flexDirection: 'row', ...nativeLtrDirection };

/** Primary body text — writing direction only; alignment follows I18nManager layout. */
export const rtlText: TextStyle = {
  writingDirection: isAppRtl() ? 'rtl' : 'ltr',
};

export function inlineStart(offset: number): ViewStyle {
  return isAppRtl() ? { right: offset } : { left: offset };
}

export function inlineEnd(offset: number): ViewStyle {
  return isAppRtl() ? { left: offset } : { right: offset };
}

export function marginStart(value: number): { marginLeft?: number; marginRight?: number } {
  return isAppRtl() ? { marginRight: value } : { marginLeft: value };
}

export function marginEnd(value: number): { marginLeft?: number; marginRight?: number } {
  return isAppRtl() ? { marginLeft: value } : { marginRight: value };
}

export function paddingStart(value: number): ViewStyle {
  return isAppRtl() ? { paddingRight: value } : { paddingLeft: value };
}

export function paddingEnd(value: number): ViewStyle {
  return isAppRtl() ? { paddingLeft: value } : { paddingRight: value };
}

export function rtlBackIcon(): string {
  return isAppRtl() ? 'angle-right' : 'angle-left';
}

export function rtlForwardIcon(): string {
  return isAppRtl() ? 'angle-left' : 'angle-right';
}

/** Arabic / RTL input fields */
export const rtlInputText: TextStyle = {
  writingDirection: 'rtl',
  textAlign: 'right',
};

/** English-only or numeric fields */
export const ltrInputText: TextStyle = {
  writingDirection: 'ltr',
  textAlign: 'left',
};

export const rtlTextInputProps = {
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
};

/** Stack / modal slide animation for the active layout direction. */
export function stackSlideAnimation(): 'slide_from_left' | 'slide_from_right' {
  return isAppRtl() ? 'slide_from_right' : 'slide_from_left';
}

export function stackSlideBackAnimation(): 'slide_from_left' | 'slide_from_right' {
  return isAppRtl() ? 'slide_from_left' : 'slide_from_right';
}
