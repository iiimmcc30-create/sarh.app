import jwt from 'jsonwebtoken';
import { PublicButcherJoinService } from '../../services/public-join.service';
import { TEST_USER_ID } from '../helpers/testUtils';

jest.mock('../../helpers/timeline', () => ({
  appendTimelineEvent: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../helpers/transaction', () => ({
  assertUserHasNoButcher: jest.fn().mockResolvedValue(undefined),
}));

const snapshot = {
  nameAr: 'ملحمة النخيل',
  nameEn: 'Nakheel Butcher',
  shopPhone: '+966501234567',
  commercialReg: 'CR-12345',
  country: 'SA' as const,
  city: 'Riyadh',
  cityAr: 'الرياض',
  address: 'Olaya street',
  addressAr: 'شارع العليا',
  lat: 24.7,
  lng: 46.7,
  openTime: '08:00',
  closeTime: '22:00',
};

describe('PublicButcherJoinService', () => {
  const jwtSecret = 'y'.repeat(32);

  const submittedApp = {
    id: 'join-app-1',
    userId: TEST_USER_ID,
    applicationNumber: 7,
    status: 'SUBMITTED',
    ...snapshot,
    bioAr: null,
    bioEn: null,
    specialties: [],
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
    user: { id: TEST_USER_ID, username: 'joinuser', phone: '+966501234567', avatar: null },
  };

  function token(phone = '+966501234567') {
    return jwt.sign({ phone, verified: true, purpose: 'join' }, jwtSecret, {
      expiresIn: '15m',
    });
  }

  function setup(opts: { existingUser?: boolean; submitted?: boolean } = {}) {
    const applications = {
      findActiveApplicationByUserAndStatus: jest.fn().mockResolvedValue(
        opts.submitted ? { id: 'existing' } : null,
      ),
      createApplication: jest.fn().mockResolvedValue(submittedApp),
      getApplicationByIdOrThrow: jest.fn().mockResolvedValue({
        ...submittedApp,
        status: 'DRAFT',
      }),
      updateApplicationStatus: jest.fn().mockResolvedValue(submittedApp),
      updateApplicationSnapshot: jest.fn(),
    };
    const transactions = {
      runInTransaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
    };
    const authRepo = {
      findExistingUser: jest.fn().mockResolvedValue(null),
      createUser: jest.fn().mockResolvedValue({ id: TEST_USER_ID }),
      followKnowledgeCenter: jest.fn().mockResolvedValue(undefined),
    };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(
          opts.existingUser
            ? {
                id: TEST_USER_ID,
                username: 'joinuser',
                role: 'USER',
                isAI: false,
                butcherProfile: null,
              }
            : null,
        ),
      },
    };
    const notifications = { notifyAfterApplicationSubmit: jest.fn().mockResolvedValue(undefined) };
    const logger = { info: jest.fn(), warn: jest.fn() };
    const config = { get: jest.fn().mockReturnValue(jwtSecret) };

    const service = new PublicButcherJoinService(
      applications as never,
      transactions as never,
      authRepo as never,
      prisma as never,
      config as never,
      notifications as never,
      logger as never,
    );
    return { service, applications, authRepo };
  }

  const body = {
    phone: '+966501234567',
    phone_token: '',
    displayName: 'أحمد',
    username: 'ahmad_join',
    acceptedTerms: true as const,
    confirmAccuracy: true as const,
    ...snapshot,
  };

  it('creates a submitted application for a new user without requiring documents', async () => {
    const { service, applications, authRepo } = setup();
    const result = await service.submitJoin({ ...body, phone_token: token() });
    expect(authRepo.createUser).toHaveBeenCalled();
    expect(applications.createApplication).toHaveBeenCalled();
    expect(applications.updateApplicationStatus).toHaveBeenCalled();
    expect(result.applicationNumber).toBe(7);
    expect(result.status).toBe('SUBMITTED');
  });

  it('blocks duplicate submitted applications', async () => {
    const { service } = setup({ existingUser: true, submitted: true });
    await expect(
      service.submitJoin({ ...body, phone_token: token() }),
    ).rejects.toMatchObject({ code: 'ACTIVE_SUBMITTED_EXISTS' });
  });

  it('rejects invalid phone tokens', async () => {
    const { service } = setup();
    await expect(
      service.submitJoin({ ...body, phone_token: 'not-a-jwt' }),
    ).rejects.toMatchObject({ error: 'invalid_phone_token' });
  });
});
