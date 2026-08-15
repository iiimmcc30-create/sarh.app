import { appFont, resolveAppFontFace } from '@/constants/fonts';

describe('resolveAppFontFace', () => {
  it('maps tab-bar weights to loaded IBM Plex files', () => {
    expect(resolveAppFontFace('500')).toEqual({
      fontFamily: appFont.medium,
      fontWeight: '500',
    });
    expect(resolveAppFontFace('600')).toEqual({
      fontFamily: appFont.semibold,
      fontWeight: '600',
    });
    expect(resolveAppFontFace('400')).toEqual({
      fontFamily: appFont.regular,
      fontWeight: '400',
    });
  });

  it('does not keep Regular file when weight is 600', () => {
    expect(resolveAppFontFace('600', appFont.regular)).toEqual({
      fontFamily: appFont.semibold,
      fontWeight: '600',
    });
  });

  it('clamps unloaded 700+ to the loaded 600 file', () => {
    expect(resolveAppFontFace('700')).toEqual({
      fontFamily: appFont.semibold,
      fontWeight: '600',
    });
    expect(resolveAppFontFace('bold')).toEqual({
      fontFamily: appFont.semibold,
      fontWeight: '600',
    });
  });

  it('preserves monospace', () => {
    expect(resolveAppFontFace('600', 'monospace').fontFamily).toBe('monospace');
  });
});
