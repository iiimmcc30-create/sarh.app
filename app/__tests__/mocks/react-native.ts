export const Alert = { alert: jest.fn() };
export const Platform = { OS: 'web' };
export const Share = { share: jest.fn(async () => ({ action: 'sharedAction' })) };
export const I18nManager = {
  isRTL: true,
  allowRTL: jest.fn(),
  forceRTL: jest.fn(),
};
export default { Alert, Platform, Share, I18nManager };
