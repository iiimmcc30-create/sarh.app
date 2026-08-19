import { Test } from '@nestjs/testing';
import { NiWebhookService } from './ni-webhook.service';
import { IntegrationOrdersRepository } from '../repositories/integration-orders.repository';
import { PaymentsService } from '../../payments/payments.service';
import { LoggerService } from '../../common/services/logger.service';

describe('NiWebhookService', () => {
  let service: NiWebhookService;
  const repo = {
    tryInsertWebhookEvent: jest.fn(),
    findByExternalOrderId: jest.fn(),
    markWebhookProcessed: jest.fn(),
  };
  const payments = {
    verifyWebhookSignature: jest.fn().mockReturnValue({ ok: true }),
    processWebhook: jest
      .fn()
      .mockResolvedValue({ status: 200, body: { received: true } }),
  };
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repo.tryInsertWebhookEvent.mockResolvedValue({ id: 'evt-1' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        NiWebhookService,
        { provide: IntegrationOrdersRepository, useValue: repo },
        { provide: PaymentsService, useValue: payments },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();
    service = moduleRef.get(NiWebhookService);
  });

  it('processes a valid webhook and stores the event', async () => {
    const raw = JSON.stringify({
      eventName: 'ORDER.PAID',
      order: {
        reference: 'a13f81f3-27b4-48b6-88de-22b9ddc1e1dc',
        state: 'PURCHASED',
      },
    });
    repo.findByExternalOrderId.mockResolvedValue({ paymentId: 'pay-1' });
    const result = await service.handleRaw(raw);
    expect(result.status).toBe(200);
    expect(payments.processWebhook).toHaveBeenCalledWith(raw);
    expect(repo.markWebhookProcessed).toHaveBeenCalled();
  });

  it('is idempotent on duplicate webhook (unique eventKey)', async () => {
    repo.tryInsertWebhookEvent.mockRejectedValue({ code: 'P2002' });
    const raw = JSON.stringify({
      eventName: 'ORDER.PAID',
      order: { reference: 'a13f81f3-27b4-48b6-88de-22b9ddc1e1dc' },
    });
    const result = await service.handleRaw(raw);
    expect(result.duplicate).toBe(true);
    expect(result.status).toBe(200);
    expect(payments.processWebhook).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON', async () => {
    const result = await service.handleRaw('not-json');
    expect(result.status).toBe(400);
  });
});
