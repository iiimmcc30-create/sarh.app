import { UploadService } from './upload.service';
import { ApiException } from '../common/exceptions/api.exception';
import { getPresignedUploadUrl, getStorageProvider } from '@/lib/storage';
import type { JwtPayload } from '../common/types/jwt-payload.interface';

jest.mock('@/lib/storage', () => ({
  getStorageProvider: jest.fn(),
  getPresignedUploadUrl: jest.fn(),
}));

function jwt(): JwtPayload {
  return { userId: 'user-a', username: 'user-a', role: 'BUTCHER' };
}

describe('UploadService presign (existing storage)', () => {
  const sessions = {
    isEnabled: jest.fn().mockReturnValue(false),
  };
  const logger = { info: jest.fn(), error: jest.fn() };
  let service: UploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    (getStorageProvider as jest.Mock).mockReturnValue('cloudinary');
    service = new UploadService(sessions as never, logger as never);
  });

  it('rejects disallowed mime types for butchers folder', async () => {
    await expect(
      service.presign(jwt(), {
        mimetype: 'application/pdf',
        folder: 'butchers',
        count: 1,
      }),
    ).rejects.toMatchObject({ status: 400 } satisfies Partial<ApiException>);
    expect(getPresignedUploadUrl).not.toHaveBeenCalled();
  });

  it('issues a signed Cloudinary slot without requiring a client butcherId', async () => {
    (getPresignedUploadUrl as jest.Mock).mockResolvedValue({
      provider: 'cloudinary',
      uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
      apiKey: 'pub-key',
      timestamp: 1,
      signature: 'signed',
      folder: 'safat/butchers',
      publicId: 'abc',
    });

    const result = await service.presign(jwt(), {
      mimetype: 'image/jpeg',
      folder: 'butchers',
    });

    expect(getPresignedUploadUrl).toHaveBeenCalledWith(
      'butchers',
      'image/jpeg',
      300,
      undefined,
    );
    expect(result.maxSizeMb).toBe(20);
    expect(result.urls[0]).toEqual(
      expect.objectContaining({
        provider: 'cloudinary',
        apiKey: 'pub-key',
        signature: 'signed',
      }),
    );
    expect(JSON.stringify(result)).not.toMatch(/api_secret|API_SECRET/i);
  });

  it('returns 503 when storage signing fails', async () => {
    (getPresignedUploadUrl as jest.Mock).mockRejectedValue(
      new Error('Cloudinary is not configured'),
    );
    await expect(
      service.presign(jwt(), { mimetype: 'image/png', folder: 'butchers' }),
    ).rejects.toMatchObject({ status: 503 } satisfies Partial<ApiException>);
  });
});
