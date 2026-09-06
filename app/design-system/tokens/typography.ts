import { appFont } from '@/constants/fonts';

/**
 * Official Sarh face: IBM Plex Sans Arabic.
 * Each weight maps to a distinct loaded family — never alias Regular/Medium/SemiBold to Bold.
 *
 * Live UI still remaps content to Bold via `resolveAppFontFace` in `fonts.ts`.
 * These tokens are the foundation for later phases; do not wire screens yet.
 */
export const fontFamily = {
  regular: appFont.regular,
  medium: appFont.medium,
  semiBold: appFont.semibold,
  bold: appFont.bold,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

export type TypeRole =
  | 'display'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'micro';

export type TypeToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: (typeof fontWeight)[keyof typeof fontWeight];
};

export const typography: Record<TypeRole, TypeToken> = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeight.bold,
  },
  heading1: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
  },
  heading2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: fontWeight.semiBold,
  },
  heading3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: fontWeight.semiBold,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeight.regular,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: fontWeight.regular,
  },
  micro: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeight.regular,
  },
};
