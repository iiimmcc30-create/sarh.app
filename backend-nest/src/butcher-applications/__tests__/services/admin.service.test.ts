import {
  ButcherApplicationAdminService,
  buildButcherCreateInput,
} from '../../services/admin.service';
import { ApplicationRepository } from '../../repositories/application.repository';
import { DocumentRepository } from '../../repositories/document.repository';
import { TransactionService } from '../../services/transaction.service';
import { ButcherApplicationNotificationsService } from '../../services/butcher-application-notifications.service';
import { LoggerService } from '../../../common/services/logger.service';
import { TEST_APP_ID, TEST_USER_ID } from '../helpers/testUtils';

jest.mock('../../helpers/timeline', () => ({
  appendTimelineEvent: jest.fn().mockResolvedValue({
    id: 'event-1',
    action: 'APPROVE',
    comment: null,
    createdBy: 'admin',
    metadata: {},
    createdAt: new Date(),
    actor: { id: 'admin', username: 'admin' },
  }),
}));

jest.mock('../../helpers/transaction', () => ({
  assertUserHasNoButcher: jest.fn().mockResolvedValue(undefined),
}));

const submittedApp = {
  id: TEST_APP_ID,
  userId: TEST_USER_ID,
  applicationNumber: 3,
  status: 'SUBMITTED' as const,
  nameAr: 'ملحمة',
  nameEn: 'Shop',
  shopPhone: '+966501234567',
  commercialReg: 'CR-1',
  country: 'SA' as const,
  city: 'Riyadh',
  cityAr: 'الرياض',
  address: 'Street',
  addressAr: 'شارع',
  lat: 24,
  lng: 46,
  bioAr: null,
  bioEn: null,
  specialties: ['sheep'],
  openTime: '08:00',
  closeTime: '22:00',
  rejectionReason: null,
  acceptedTermsAt: new Date(),
  submittedAt: new Date(),
  approvedAt: null,
  rejectedAt: null,
  withdrawnAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  documents: [],
  timelineEvents: [],
  sourcedButcher: null,
  user: { id: TEST_USER_ID, username: 'user', phone: null, avatar: null },
};

describe('buildButcherCreateInput', () => {
  it('maps application snapshot into butcher create input', () => {
    const input = buildButcherCreateInput(submittedApp as never);
    expect(input.userId).toBe(TEST_USER_ID);
    expect(input.nameAr).toBe('ملحمة');
    expect(input.sourceApplicationId).toBe(TEST_APP_ID);
  });
});

describe('ButcherApplicationAdminService', () => {
  const applications = {
    listApplicationsAdmin: jest.fn(),
    getApplicationByIdOrThrow: jest.fn(),
    updateApplicationStatus: jest.fn(),
    createButcherFromApplication: jest.fn(),
  } as unknown as ApplicationRepository;

  const documents = {
    listDocuments: jest.fn(),
  } as unknown as DocumentRepository;

  const transactions = {
    runInTransaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({}),
    ),
  } as unknown as TransactionService;

  const applicationNotifications = {
    notifyApplicationApproved: jest.fn().mockResolvedValue(undefined),
    notifyApplicationRejected: jest.fn().mockResolvedValue(undefined),
  } as unknown as ButcherApplicationNotificationsService;

  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as LoggerService;

  const service = new ButcherApplicationAdminService(
    applications,
    documents,
    transactions,
    applicationNotifications,
    logger,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (transactions.runInTransaction as jest.Mock).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );
  });

  it('rejects approval when application is not submitted', async () => {
    (applications.getApplicationByIdOrThrow as jest.Mock).mockResolvedValue({
      ...submittedApp,
      status: 'DRAFT',
    });

    await expect(
      service.approveApplication('admin-1', TEST_APP_ID, {}),
    ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
  });

  it('rejects rejection without reason', async () => {
    (applications.getApplicationByIdOrThrow as jest.Mock).mockResolvedValue(
      submittedApp,
    );

    await expect(
      service.rejectApplication('admin-1', TEST_APP_ID, {
        rejectionReason: '',
      }),
    ).rejects.toMatchObject({ code: 'REJECTION_REASON_REQUIRED' });
  });
});
