import { I18nManager, Platform } from 'react-native';
import { getRtlText, rtlStartAlign, setupRtl } from '../lib/rtl';

describe('rtl text alignment (RN mirrors left/right under RTL)', () => {
  afterEach(() => {
    Platform.OS = 'web';
    I18nManager.isRTL = false;
    setupRtl('ar');
  });

  it('uses physical right on web for Arabic', () => {
    Platform.OS = 'web';
    setupRtl('ar');
    expect(rtlStartAlign()).toBe('right');
    expect(getRtlText()).toEqual({
      writingDirection: 'rtl',
      textAlign: 'right',
    });
  });

  it('uses textAlign left on native when I18nManager.isRTL (maps to visual right)', () => {
    Platform.OS = 'android';
    I18nManager.isRTL = true;
    expect(rtlStartAlign()).toBe('left');
    expect(getRtlText()).toEqual({
      writingDirection: 'rtl',
      textAlign: 'left',
    });
  });

  it('uses physical right on native when layout is still LTR', () => {
    Platform.OS = 'android';
    I18nManager.isRTL = false;
    expect(rtlStartAlign()).toBe('right');
  });

  it('keeps LTR helpers for English locale on web', () => {
    Platform.OS = 'web';
    setupRtl('en');
    expect(getRtlText()).toEqual({
      writingDirection: 'ltr',
      textAlign: 'left',
    });
  });
});
