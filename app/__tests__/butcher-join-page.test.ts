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

  it('shows an official received-application success screen', () => {
    expect(success).toContain('تم استلام طلب الانضمام');
    expect(success).toContain('تم إرسال طلبك إلى فريق سرح للمراجعة');
    expect(success).toContain('رقم الطلب');
  });
});
