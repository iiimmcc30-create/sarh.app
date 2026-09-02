import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';

describe('public butcher join journey', () => {
  const joinPage = readFileSync(pathJoin(__dirname, '../app/join/index.tsx'), 'utf8');
  const success = readFileSync(pathJoin(__dirname, '../app/join/success.tsx'), 'utf8');

  it('submits to the existing butcher-applications join API', () => {
    expect(joinPage).toContain('/api/butcher-applications/join');
    expect(joinPage).toContain("purpose: 'join'");
    expect(joinPage).not.toMatch(/جمل|ماعز|goat|camel/i);
  });

  it('links existing shops to the butcher dashboard login', () => {
    expect(joinPage).toContain('SARH_BUTCHER_LOGIN_URL');
    expect(joinPage).toContain('لديك حساب ملحمة؟ تسجيل الدخول');
  });

  it('sends سجل ملحمتك to the public /join page', () => {
    const more = readFileSync(pathJoin(__dirname, '../app/butchers/more.tsx'), 'utf8');
    const sidebar = readFileSync(
      pathJoin(__dirname, '../components/feature/ButchersMarketSidebar.tsx'),
      'utf8',
    );
    expect(more).toContain("safePush('/join'");
    expect(more).not.toContain("safePush('/auth/phone'");
    expect(sidebar).toContain("route: '/join'");
  });

  it('shows an official received-application success screen', () => {
    expect(success).toContain('تم استلام طلب الانضمام');
    expect(success).toContain('تم إرسال طلبك إلى فريق سرح للمراجعة');
    expect(success).toContain('رقم الطلب');
  });
});
