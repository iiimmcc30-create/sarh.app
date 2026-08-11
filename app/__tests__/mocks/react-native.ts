export const Alert = { alert: jest.fn() };

export const Platform = {
  OS: 'web' as string,
};

export const I18nManager = {
  isRTL: false,
  allowRTL: jest.fn(),
  forceRTL: jest.fn(),
  swapLeftAndRightInRTL: jest.fn(),
  getConstants: () => ({
    isRTL: false,
    doLeftAndRightSwapInRTL: true,
  }),
};

export default { Alert, Platform, I18nManager };
