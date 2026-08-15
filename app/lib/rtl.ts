import { I18nManager, Platform, type TextStyle, type ViewStyle } from 'react-native';
import {
  DEFAULT_LOCALE,
  type AppLocale,
  localeUsesRtl,
  LOCALE_STORAGE_KEY,
  normalizeAppLocale,
} from '@/lib/locale';

/** Locale-driven RTL flag — required on web where I18nManager is a no-op stub. */
let activeRtl = localeUsesRtl(DEFAULT_LOCALE);
let activeLocale: AppLocale = DEFAULT_LOCALE;

function applyDocumentDirection(locale: AppLocale, rtl: boolean) {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  root.setAttribute('lang', locale === 'ar' ? 'ar' : 'en');
  if (document.body) {
    document.body.style.direction = rtl ? 'rtl' : 'ltr';
  }
}

/**
 * Patch react-native-web's I18nManager stub so Expo Router / React Navigation
 * read isRTL=true (their default direction comes from getConstants().isRTL).
 */
export function patchWebI18nManager(rtl: boolean): void {
  if (Platform.OS !== 'web') return;
  const mgr = I18nManager as unknown as {
    allowRTL?: (v: boolean) => void;
    forceRTL?: (v: boolean) => void;
    swapLeftAndRightInRTL?: (v: boolean) => void;
    getConstants?: () => { isRTL: boolean };
    isRTL?: boolean;
  };

  mgr.allowRTL = () => undefined;
  mgr.forceRTL = (value: boolean) => {
    activeRtl = !!value;
    try {
      Object.defineProperty(mgr, 'isRTL', {
        configurable: true,
        enumerable: true,
        get: () => activeRtl,
      });
    } catch {
      mgr.isRTL = activeRtl;
    }
  };
  mgr.swapLeftAndRightInRTL = () => undefined;
  mgr.getConstants = () => ({ isRTL: activeRtl });
  mgr.forceRTL(rtl);
}

/** Read layout direction — locale-backed on web, I18nManager on native. */
export function isAppRtl(): boolean {
  if (Platform.OS === 'web') return activeRtl;
  return !!I18nManager.isRTL;
}

/** @deprecated Use `isAppRtl()` — kept for existing imports. */
export const isRTL = activeRtl;

/**
 * Configure RTL/LTR via official I18nManager (native) + document dir (web).
 * Call once before the app bundle renders (see `index.js`).
 */
export function setupRtl(locale: AppLocale = DEFAULT_LOCALE): void {
  const rtl = localeUsesRtl(locale);
  activeLocale = locale;
  activeRtl = rtl;

  if (Platform.OS === 'web') {
    patchWebI18nManager(rtl);
    applyDocumentDirection(locale, rtl);
    return;
  }

  I18nManager.allowRTL(true);
  I18nManager.forceRTL(rtl);
  I18nManager.swapLeftAndRightInRTL(rtl);
}

/** Apply stored locale on cold start (async). May require reload if direction changes. */
export async function setupRtlFromStorage(
  getItem: (key: string) => Promise<string | null>,
): Promise<AppLocale> {
  const stored = normalizeAppLocale(await getItem(LOCALE_STORAGE_KEY));
  setupRtl(stored);
  return stored;
}

export function getActiveLocale(): AppLocale {
  return activeLocale;
}

/** Root / screen layout direction for the active locale. */
export function getRtlDirection(): ViewStyle {
  return { direction: isAppRtl() ? 'rtl' : 'ltr' };
}

/**
 * Logical RTL row — flex follows app direction (navigation bars, input rows).
 * For mixed [text + icon] cover rows use `getCoverTrailRowStyle()` / `CoverTrailRow`.
 */
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

/**
 * Glyph alignment only — insufficient inside flex rows without bounds.
 * Prefer `getRtlBlockTextStyle()` inside `RtlTextShell`, or the `RtlText` component.
 */
export function getRtlText(): TextStyle {
  return isAppRtl()
    ? { writingDirection: 'rtl', textAlign: 'right' }
    : { writingDirection: 'ltr', textAlign: 'left' };
}

export type PhysicalLtrShellOptions = {
  /** `flex: 1` + `minWidth: 0` for text inside a horizontal row. Default: full-width block. */
  flex?: boolean;
};

/**
 * Physical LTR island — gives Text a stable box under global RTL flex.
 * Does not change business logic; only layout bounds.
 */
export function getPhysicalLtrShellStyle(options?: PhysicalLtrShellOptions): ViewStyle {
  const flex = options?.flex ?? false;
  if (flex) {
    return { flex: 1, minWidth: 0, direction: 'ltr' };
  }
  return { width: '100%', direction: 'ltr' };
}

export type CoverTrailRowOptions = {
  flex?: boolean;
  justifyContent?: ViewStyle['justifyContent'];
  gap?: number;
};

/**
 * Cover trail row — physical LTR order for [text + icon/image/button] clusters.
 * Icon/image on physical right; text shell adjacent (see SidebarMenuItem, SectionHeader).
 */
export function getCoverTrailRowStyle(options?: CoverTrailRowOptions): ViewStyle {
  return {
    flexDirection: 'row',
    direction: 'ltr',
    alignItems: 'center',
    minWidth: 0,
    ...(options?.flex ? { flex: 1 } : null),
    ...(options?.justifyContent ? { justifyContent: options.justifyContent } : null),
    ...(options?.gap != null ? { gap: options.gap } : null),
  };
}

/** Block Arabic text — use inside `RtlTextShell` (includes `width: '100%'`). */
export function getRtlBlockTextStyle(): TextStyle {
  return isAppRtl()
    ? { width: '100%', textAlign: 'right', writingDirection: 'rtl' }
    : { width: '100%', textAlign: 'left', writingDirection: 'ltr' };
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
