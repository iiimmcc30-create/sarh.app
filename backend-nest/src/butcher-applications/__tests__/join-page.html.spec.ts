import {
  escapeJoinHtml,
  renderButcherJoinPage,
  renderButcherJoinSuccessPage,
} from '../join-page.html';

describe('public butcher join HTML', () => {
  it('renders the dark Sarh registration page', () => {
    const html = renderButcherJoinPage();
    expect(html).toContain('انضمام الملاحم');
    expect(html).toContain('#07131C');
    expect(html).toContain('#20B66F');
    expect(html).toContain('/api/auth/send-otp');
    expect(html).toContain('/api/butcher-applications/join');
    expect(html).toContain("purpose: 'join'");
    expect(html).toContain('https://sarhsa.online/butcher/login');
    expect(html).not.toMatch(/APIKEY|apiKey|password_hash/i);
  });

  it('escapes success query values', () => {
    const html = renderButcherJoinSuccessPage({
      applicationNumber: '<script>',
      nameAr: 'ملحمة "أ"',
    });
    expect(html).toContain('تم استلام طلب الانضمام');
    expect(html).toContain('#&lt;script&gt;');
    expect(html).toContain('ملحمة &quot;أ&quot;');
    expect(html).not.toContain('<script>');
  });

  it('escapes HTML entities', () => {
    expect(escapeJoinHtml('a <b> & "c"')).toBe(
      'a &lt;b&gt; &amp; &quot;c&quot;',
    );
  });
});
