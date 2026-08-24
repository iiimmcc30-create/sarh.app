import { validateProductionEnv } from './validate-production-env';

describe('validateProductionEnv', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('is a no-op outside production', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_URL;
    expect(() => validateProductionEnv()).not.toThrow();
  });

  it('aborts production when critical vars are missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_VERIFY_SERVICE_SID;
    delete process.env.NI_BASE_URL;
    delete process.env.NI_OUTLET_ID;
    delete process.env.NI_API_KEY;
    delete process.env.NI_WEBHOOK_SECRET;
    delete process.env.STORAGE_PROVIDER;
    delete process.env.REDIS_HOST;
    process.env.REDIS_ENABLED = 'true';

    expect(() => validateProductionEnv()).toThrow(
      /Application startup validation failed/,
    );
    expect(() => validateProductionEnv()).toThrow(/DATABASE_URL/);
    expect(() => validateProductionEnv()).toThrow(
      /Application startup aborted/,
    );
  });

  it('rejects DEV_OTP and mock NI keys in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/db';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'y'.repeat(32);
    process.env.TWILIO_ACCOUNT_SID = 'ACrealaccountsid012345678901234567';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_VERIFY_SERVICE_SID = 'VA123';
    process.env.NI_BASE_URL = 'https://api-gateway.ksa.ngenius-payments.com';
    process.env.NI_OUTLET_ID = 'a13f81f3-27b4-48b6-88de-22b9ddc1e1dc';
    process.env.NI_API_KEY = 'test_key';
    process.env.NI_WEBHOOK_SECRET = 'whsec';
    process.env.STORAGE_PROVIDER = 'cloudinary';
    process.env.CLOUDINARY_CLOUD_NAME = 'c';
    process.env.CLOUDINARY_API_KEY = 'k';
    process.env.CLOUDINARY_API_SECRET = 's';
    process.env.REDIS_HOST = 'redis';
    process.env.DEV_OTP = 'true';

    expect(() => validateProductionEnv()).toThrow(/DEV_OTP/);
    expect(() => validateProductionEnv()).toThrow(/NI_API_KEY/);
  });

  it('passes when production env is complete', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/db';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'y'.repeat(32);
    process.env.TWILIO_ACCOUNT_SID = 'ACrealaccountsid012345678901234567';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_VERIFY_SERVICE_SID = 'VA123';
    process.env.NI_BASE_URL = 'https://api-gateway.ksa.ngenius-payments.com';
    process.env.NI_OUTLET_ID = 'a13f81f3-27b4-48b6-88de-22b9ddc1e1dc';
    process.env.NI_API_KEY = 'live_real_key_not_test';
    process.env.NI_WEBHOOK_SECRET = 'whsec';
    process.env.STORAGE_PROVIDER = 'cloudinary';
    process.env.CLOUDINARY_CLOUD_NAME = 'c';
    process.env.CLOUDINARY_API_KEY = 'k';
    process.env.CLOUDINARY_API_SECRET = 's';
    process.env.REDIS_HOST = 'redis';
    delete process.env.DEV_OTP;

    expect(() => validateProductionEnv()).not.toThrow();
  });
});
