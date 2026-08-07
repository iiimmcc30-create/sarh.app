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

/** Root / screen layout direction for the active locale. */
export function getRtlDirection(): ViewStyle {
  if (isAppRtl()) {
    return Platform.OS === 'web' ? { direction: 'rtl' } : { direction: 'rtl' };
  }
  return Platform.OS === 'web' ? { direction: 'ltr' } : {};
}

/** Horizontal row that respects layout direction (RTL Arabic vs LTR English). */
export function getRtlRow(): ViewStyle {
  if (isAppRtl()) {
    return Platform.OS === 'web'
      ? { flexDirection: 'row-reverse' }
      : { flexDirection: 'row', direction: 'rtl' };
  }
  return Platform.OS === 'web'
    ? { flexDirection: 'row', direction: 'ltr' }
    : { flexDirection: 'row' };
}

/** Primary body text — writing direction follows active locale. */
export function getRtlText(): TextStyle {
  return { writingDirection: isAppRtl() ? 'rtl' : 'ltr' };
}

/** Text alignment for the active locale (Arabic end / English start). */
export function rtlTextAlign(): TextStyle {
  return { textAlign: isAppRtl() ? 'right' : 'left' };
}

/** Cross-axis alignment at inline start. */
export function alignInlineStart(): ViewStyle {
  return { alignItems: isAppRtl() ? 'flex-end' : 'flex-start' };
}

/** Cross-axis alignment at inline end. */
export function alignInlineEnd(): ViewStyle {
  return { alignItems: isAppRtl() ? 'flex-start' : 'flex-end' };
}

/** Self alignment pushed to inline end (e.g. header actions). */
export function selfInlineEnd(): ViewStyle {
  return { alignSelf: isAppRtl() ? 'flex-start' : 'flex-end' };
}

/** Snapshot at module load — prefer getRtlDirection() in render when locale can change. */
export const rtlDirection: ViewStyle = getRtlDirection();

/** Snapshot at module load — prefer getRtlRow() in render when locale can change. */
export const rtlRow: ViewStyle = getRtlRow();

/** Snapshot at module load — prefer getRtlText() in render when locale can change. */
export const rtlText: TextStyle = getRtlText();

export function inlineStart(offset: number): ViewStyle {
  return isAppRtl() ? { right: offset } : { left: offset };
}

export function inlineEnd(offset: number): ViewStyle {
  return isAppRtl() ? { left: offset } : { right: offset };
}

export function positionInlineStart(value: number | `${number}%`): ViewStyle {
  return isAppRtl() ? { right: value } : { left: value };
}

export function positionInlineEnd(value: number | `${number}%`): ViewStyle {
  return isAppRtl() ? { left: value } : { right: value };
}

export function marginStart(value: number): ViewStyle {
  return isAppRtl() ? { marginRight: value } : { marginLeft: value };
}

export function marginEnd(value: number): ViewStyle {
  return isAppRtl() ? { marginLeft: value } : { marginRight: value };
}

export function marginAutoStart(): ViewStyle {
  return isAppRtl() ? { marginRight: 'auto' } : { marginLeft: 'auto' };
}

export function marginAutoEnd(): ViewStyle {
  return isAppRtl() ? { marginLeft: 'auto' } : { marginRight: 'auto' };
}

export function paddingStart(value: number): ViewStyle {
  return isAppRtl() ? { paddingRight: value } : { paddingLeft: value };
}

export function paddingEnd(value: number): ViewStyle {
  return isAppRtl() ? { paddingLeft: value } : { paddingRight: value };
}

export function borderInlineStart(width: number, color: string): ViewStyle {
  return isAppRtl()
    ? { borderRightWidth: width, borderRightColor: color }
    : { borderLeftWidth: width, borderLeftColor: color };
}

export function borderInlineEnd(width: number, color: string): ViewStyle {
  return isAppRtl()
    ? { borderLeftWidth: width, borderLeftColor: color }
    : { borderRightWidth: width, borderRightColor: color };
}

export function bubbleTailRadius(isOwn: boolean): ViewStyle {
  if (isOwn) {
    return isAppRtl()
      ? { borderBottomLeftRadius: 4 }
      : { borderBottomRightRadius: 4 };
  }
  return isAppRtl()
    ? { borderBottomRightRadius: 4 }
    : { borderBottomLeftRadius: 4 };
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
