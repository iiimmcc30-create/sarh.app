import { readFileSync } from 'fs';
import path from 'path';
import { showToast, type ToastType } from '@/lib/toast';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

describe('design-system unification — allowed redesigns only', () => {
  it('Feed header uses design-system text and does not touch PostItem', () => {
    const feed = src('app/(tabs)/posts.tsx');
    const post = src('components/feature/PostItem.tsx');
    expect(feed).toContain("from '@/design-system/components'");
    expect(feed).toContain('المنشورات');
    expect(feed).toContain("tab === 'for_you' ? 'لك' : 'متابعة'");
    expect(feed).not.toContain('PostItem layout');
    expect(post).toContain("from '@/components/ui/AppText'");
    expect(post).toContain('ellipsis-vertical');
    expect(post).not.toContain("from '@/design-system/components'");
  });

  it('bottom nav keeps the pre-unification chrome and the same routes', () => {
    const tabs = src('components/navigation/FloatingTabBar.tsx');
    expect(tabs).toContain("route: 'index'");
    expect(tabs).toContain("route: 'market'");
    expect(tabs).toContain("route: 'messages'");
    expect(tabs).toContain("route: 'posts'");
    expect(tabs).toContain("label: 'مجتمع سرح'");
    expect(tabs).toContain('navigateToCreateListing');
    expect(tabs).toContain('addBox');
    expect(tabs).not.toContain("route: 'profile'");
  });

  it('profile keeps share in the more menu and drops the header share arrow', () => {
    const layout = src('components/feature/ProfileScreenLayout.tsx');
    const visitor = src('app/users/[id].tsx');
    expect(layout).not.toContain('share-arrow');
    expect(layout).not.toContain('accessibilityLabel="مشاركة"');
    expect(layout).toContain('accessibilityLabel="المزيد"');
    expect(layout).toContain('SarhButton');
    expect(layout).toContain('متابعة');
    expect(layout).toContain('مراسلة');
    expect(visitor).toContain("key: 'share'");
    expect(visitor).toContain('مشاركة الملف');
  });

  it('sidebar keeps the same sections and adds two hairline separators', () => {
    const panel = src('components/feature/AppSidebar.tsx');
    expect(panel).toContain('الملف الشخصي');
    expect(panel).toContain('مركز المعلومات');
    expect(panel).toContain('مركز المساعدة');
    expect(panel).toContain('الإعدادات والخصوصية');
    expect(panel).toContain("route: '/settings/info'");
    expect(panel).toContain("route: '/support'");
    expect(panel).toContain("route: '/profile/settings'");
    expect((panel.match(/SarhDivider/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(panel).toContain('secondaryLabel');
    expect(panel).toContain('variant="bodySmall"');
  });

  it('butcher store tabs keep the same kinds and use the design-system indicator', () => {
    const bar = src('components/butcher/ButcherCategoryBar.tsx');
    const store = src('app/butchers/[id].tsx');
    expect(store).toContain("label: 'عروضنا'");
    expect(store).toContain("label: 'عن الملحمة'");
    expect(bar).toContain("from '@/design-system/components'");
    expect(bar).toContain('SarhChip');
  });

  it('legacy PrimaryButton delegates to SarhButton', () => {
    const button = src('components/ui/PrimaryButton.tsx');
    expect(button).toContain('SarhButton');
    expect(button).toContain("from '@/design-system/components'");
    expect(button).not.toContain('LinearGradient');
  });

  it('toast host supports success/error/warning/info', () => {
    const toast = src('lib/toast.ts');
    const host = src('components/ui/ToastHost.tsx');
    expect(toast).toContain("'warning'");
    expect(host).toContain('warning');
    expect(host).toContain('AppText');
    expect(host).toContain('SarhSurface');
    const types: ToastType[] = ['success', 'error', 'warning', 'info'];
    expect(types).toHaveLength(4);
    expect(typeof showToast).toBe('function');
  });
});
