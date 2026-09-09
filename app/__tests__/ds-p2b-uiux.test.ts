import { readFileSync } from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

describe('P2-B UI/UX finalization', () => {
  it('keeps ListingCard, PostItem, and FloatingTabBar visually frozen', () => {
    const card = src('components/feature/ListingCard.tsx');
    const post = src('components/feature/PostItem.tsx');
    const tabs = src('components/navigation/FloatingTabBar.tsx');
    expect(card).toContain('export const ListingCard');
    expect(post).toContain("from '@/components/ui/AppText'");
    expect(post).not.toContain("from '@/design-system/components'");
    expect(tabs).toContain("label: 'مجتمع سرح'");
    expect(tabs).not.toContain('SarhButton');
    expect(tabs).not.toContain('SarhBackButton');
  });

  it('auth join profile and compose inputs use writing-direction helpers, not physical textAlign right', () => {
    const files = [
      'app/auth/phone.tsx',
      'app/auth/register.tsx',
      'app/auth/forgot-password.tsx',
      'app/auth/otp.tsx',
      'app/join/index.tsx',
      'app/profile/edit.tsx',
      'app/create/post.tsx',
      'app/create/story.tsx',
      'app/live/create.tsx',
      'app/butchers/order.tsx',
      'app/butchers/chat.tsx',
      'app/butchers/story-viewer.tsx',
    ];
    for (const file of files) {
      const text = src(file);
      expect(text).not.toContain('textAlign="right"');
      expect(text).not.toContain('textAlign={isAppRtl()');
    }
    expect(src('app/auth/phone.tsx')).toContain('ltrInputText');
    expect(src('app/auth/register.tsx')).toContain('rtlInputText');
    expect(src('app/auth/register.tsx')).toContain('ltrInputText');
    expect(src('app/join/index.tsx')).toContain('ltrInputText');
    expect(src('app/profile/edit.tsx')).toContain('rtlInputText');
  });

  it('constrains auth and join forms on tablet without full-bleed stretch', () => {
    expect(src('app/auth/phone.tsx')).toContain('maxWidth: 440');
    expect(src('app/auth/register.tsx')).toContain('maxWidth: 440');
    expect(src('app/auth/forgot-password.tsx')).toContain('maxWidth: 440');
    expect(src('app/auth/otp.tsx')).toContain('maxWidth: 440');
    expect(src('app/join/index.tsx')).toContain('maxWidth: 560');
    expect(src('app/profile/edit.tsx')).toContain('maxWidth: 560');
  });

  it('adds map load/error retry and password a11y on auth', () => {
    const map = src('app/butchers/map.tsx');
    expect(map).toContain('تعذر تحميل الملاحم');
    expect(map).toContain('جاري تحميل الملاحم');
    expect(map).toContain('setLoadState');
    expect(src('app/auth/phone.tsx')).toContain('إظهار كلمة المرور');
    expect(src('app/auth/register.tsx')).toContain('accessibilityRole="checkbox"');
  });
});
