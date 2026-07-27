import {
  classifyNiOrderState,
  formatNiGatewayError,
  NiGatewayError,
  niOrderStateLabelAr,
  resolveNiOrderState,
  extractNiPaymentStates,
} from './ni-client';

describe('NI payment state classification', () => {
  describe('classifyNiOrderState — success', () => {
    it.each(['CAPTURED', 'PURCHASED', 'PAID', 'SUCCESS', 'captured', 'Purchased'])(
      'treats %s as success',
      (state) => {
        expect(classifyNiOrderState(state)).toBe('success');
      },
    );
  });

  describe('classifyNiOrderState — failed / cancelled / expired', () => {
    it.each([
      'FAILED',
      'DECLINED',
      'CANCELLED',
      'EXPIRED',
      'REVERSED',
      'CLOSED',
      'cancelled',
      'expired',
    ])('treats %s as failed', (state) => {
      expect(classifyNiOrderState(state)).toBe('failed');
    });
  });

  describe('classifyNiOrderState — processing / edge', () => {
    it.each(['STARTED', 'PENDING', 'AUTHORISED', 'AUTHORIZED', '', 'UNKNOWN'])(
      'treats %s as processing',
      (state) => {
        expect(classifyNiOrderState(state)).toBe('processing');
      },
    );
  });

  describe('niOrderStateLabelAr', () => {
    it('returns Arabic labels for each outcome', () => {
      expect(niOrderStateLabelAr('success')).toContain('نجاح');
      expect(niOrderStateLabelAr('failed')).toContain('فشل');
      expect(niOrderStateLabelAr('processing')).toContain('معالجة');
    });
  });

  describe('resolveNiOrderState', () => {
    it('prefers nested payment state over order state when present', () => {
      const order = {
        state: 'STARTED',
        _embedded: {
          payment: [{ state: 'CAPTURED' }],
        },
      };
      expect(resolveNiOrderState(order)).toBe('CAPTURED');
    });

    it('falls back to order.state', () => {
      expect(resolveNiOrderState({ state: 'FAILED' })).toBe('FAILED');
    });

    it('returns empty string for empty order', () => {
      expect(resolveNiOrderState({})).toBe('');
    });
  });

  describe('extractNiPaymentStates', () => {
    it('collects payment states from embedded payload', () => {
      const states = extractNiPaymentStates({
        _embedded: {
          payment: [{ state: 'FAILED' }, { state: 'CAPTURED' }],
        },
      });
      expect(states).toEqual(expect.arrayContaining(['FAILED', 'CAPTURED']));
    });

    it('returns empty array when no payments', () => {
      expect(extractNiPaymentStates({})).toEqual([]);
    });
  });

  describe('formatNiGatewayError', () => {
    it('formats NiGatewayError with status', () => {
      const err = new NiGatewayError('gateway down', 'fetch_order', 502);
      expect(formatNiGatewayError(err)).toContain('gateway down');
      expect(formatNiGatewayError(err)).toContain('502');
    });

    it('formats generic Error', () => {
      expect(formatNiGatewayError(new Error('boom'))).toBe('boom');
    });

    it('stringifies unknown', () => {
      expect(formatNiGatewayError(42)).toBe('42');
    });
  });
});

/**
 * Payment fulfillment contract (no DB):
 * Only CAPTURED/PURCHASED may activate subscription / listing / order.
 * Cancel / decline / expire / fail must NOT fulfill.
 */
describe('Payment fulfillment gate contract', () => {
  const fulfillable = (state: string) => classifyNiOrderState(state) === 'success';

  it('does not fulfill on cancel', () => {
    expect(fulfillable('CANCELLED')).toBe(false);
  });

  it('does not fulfill on expire', () => {
    expect(fulfillable('EXPIRED')).toBe(false);
  });

  it('does not fulfill on decline/fail', () => {
    expect(fulfillable('DECLINED')).toBe(false);
    expect(fulfillable('FAILED')).toBe(false);
  });

  it('does not fulfill while processing', () => {
    expect(fulfillable('STARTED')).toBe(false);
    expect(fulfillable('PENDING')).toBe(false);
  });

  it('fulfills only on confirmed capture/purchase', () => {
    expect(fulfillable('CAPTURED')).toBe(true);
    expect(fulfillable('PURCHASED')).toBe(true);
  });
});
