import { readFileSync } from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

describe('Sidebar + bottom nav + profile/settings flatten', () => {
  it('replaces المزيد with مجتمع سرح and shows profile tab', () => {
    const tabs = src('components/navigation/FloatingTabBar.tsx');
    const layout = src('app/(tabs)/_layout.tsx');
    expect(tabs).toContain("label: 'مجتمع سرح'");
    expect(tabs).toContain("route: 'posts'");
    expect(tabs).toContain("route: 'profile'");
    expect(tabs).not.toContain("label: 'المزيد'");
    expect(layout).toContain("title: 'مجتمع سرح'");
    expect(layout).toContain("href: null");
    expect(layout).toContain("name=\"more\"");
  });

  it('opens the existing sidebar route from the home avatar', () => {
    const home = src('app/(tabs)/index.tsx');
    const sidebar = src('app/sidebar.tsx');
    const panel = src('components/feature/AppSidebar.tsx');
    expect(home).toContain("safePush('/sidebar'");
    expect(sidebar).toContain('AppSidebar');
    expect(panel).toContain('الملف الشخصي');
    expect(panel).toContain('مركز المعلومات');
    expect(panel).toContain("route: '/settings/info'");
    expect(panel).toContain("route: '/support'");
    expect(panel).toContain("route: '/profile/settings'");
    expect(panel).toContain('weather-night');
    expect(panel).not.toContain('menuCardStyle');
  });

  it('flattens own-profile stats/tabs and removes settings icon entry', () => {
    const profile = src('app/(tabs)/profile.tsx');
    const layout = src('components/feature/ProfileScreenLayout.tsx');
    expect(profile).not.toContain('onSettings=');
    expect(layout).toContain("backgroundColor: 'transparent'");
    expect(layout).not.toContain('MENU_CARD');
  });

  it('uses flat settings sections', () => {
    const settings = src('components/feature/ProfileSettingsMenuScreen.tsx');
    expect(settings).toContain('variant="flat"');
  });
});
