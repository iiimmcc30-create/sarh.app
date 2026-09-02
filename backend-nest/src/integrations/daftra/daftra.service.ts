import { Injectable } from '@nestjs/common';
import type { DaftraIntegrationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailQueueService } from '../../queue/services/email-queue.service';
import { LoggerService } from '../../common/services/logger.service';
import { throwApi } from '../../common/exceptions/api.exception';
import {
  decryptSecret,
  encryptSecret,
  maskSecretLast4,
  secretLast4,
} from '../../common/crypto/secret-encryption';
import { appendTimelineEvent } from '../../butcher-applications/helpers/timeline';
import {
  assertValidDaftraAccountIdentifier,
  createDaftraClient,
  testDaftraConnection,
} from './daftra.client';
import type {
  ConfigureDaftraInput,
  DaftraPublicStatus,
  LinkDaftraProductInput,
  TestDaftraInput,
} from './daftra.types';
import { DaftraClient } from './daftra.http-client';
import {
  DAFTRA_PATHS,
  DAFTRA_PRODUCT_PAGE_DEFAULT,
  DAFTRA_PRODUCT_PAGE_MAX,
} from './daftra.constants';
import { isDaftraRequestError } from './daftra.errors';
import {
  mapDaftraProduct,
  mapDaftraProductPage,
  mapDaftraProductStock,
  type DaftraProduct,
  type DaftraProductPage,
  type DaftraProductStock,
} from './daftra.mappers';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';

const LOGIN_URL_RE = /^https:\/\/[^\s]+$/i;

function toPublicStatus(
  butcherId: string,
  row: {
    accountIdentifier: string;
    apiKeyLast4: string;
    status: DaftraIntegrationStatus;
    lastConnectionTestAt: Date | null;
    lastConnectionError: string | null;
    daftraLoginEmail: string | null;
    daftraLoginUrl: string | null;
  } | null,
): DaftraPublicStatus {
  if (!row) {
    return {
      butcherId,
      status: 'NOT_CONFIGURED',
      accountIdentifier: null,
      apiKeyMasked: null,
      lastConnectionTestAt: null,
      lastConnectionError: null,
      daftraLoginEmail: null,
      daftraLoginUrl: null,
      configured: false,
    };
  }
  return {
    butcherId,
    status: row.status,
    accountIdentifier: row.accountIdentifier,
    apiKeyMasked: maskSecretLast4(row.apiKeyLast4),
    lastConnectionTestAt: row.lastConnectionTestAt?.toISOString() ?? null,
    lastConnectionError: row.lastConnectionError,
    daftraLoginEmail: row.daftraLoginEmail,
    daftraLoginUrl: row.daftraLoginUrl,
    configured: true,
  };
}

@Injectable()
export class DaftraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
    private readonly logger: LoggerService,
  ) {}

  async getStatus(butcherId: string): Promise<DaftraPublicStatus> {
    await this.assertButcherExists(butcherId);
    const row = await this.prisma.butcherDaftraIntegration.findUnique({
      where: { butcherId },
    });
    return toPublicStatus(butcherId, row);
  }

  async configure(
    adminUserId: string,
    butcherId: string,
    input: ConfigureDaftraInput,
  ): Promise<DaftraPublicStatus> {
    await this.assertButcherExists(butcherId);
    let accountIdentifier: string;
    try {
      accountIdentifier = assertValidDaftraAccountIdentifier(
        input.accountIdentifier,
      );
    } catch {
      throwApi(400, 'invalid_account', 'معرّف حساب دفترة غير صالح');
    }

    const loginEmail = input.daftraLoginEmail?.trim() || null;
    const loginUrl = input.daftraLoginUrl?.trim() || null;
    if (loginUrl && !LOGIN_URL_RE.test(loginUrl)) {
      throwApi(
        400,
        'invalid_login_url',
        'رابط دخول دفترة يجب أن يبدأ بـ https://',
      );
    }

    const existing = await this.prisma.butcherDaftraIntegration.findUnique({
      where: { butcherId },
    });

    const apiKey = input.apiKey?.trim();
    if (!apiKey && !existing) {
      throwApi(400, 'api_key_required', 'مفتاح API مطلوب لإعداد التكامل');
    }
    if (apiKey && apiKey.length < 16) {
      throwApi(400, 'invalid_api_key', 'مفتاح API غير صالح');
    }

    const encrypted = apiKey ? encryptSecret(apiKey) : null;

    const data: Prisma.ButcherDaftraIntegrationUncheckedCreateInput = {
      butcherId,
      accountIdentifier,
      apiKeyCiphertext: encrypted?.ciphertext ?? existing!.apiKeyCiphertext,
      apiKeyIv: encrypted?.iv ?? existing!.apiKeyIv,
      apiKeyTag: encrypted?.tag ?? existing!.apiKeyTag,
      apiKeyLast4: apiKey ? secretLast4(apiKey) : existing!.apiKeyLast4,
      status: existing?.status === 'DISABLED' ? 'DISABLED' : 'NOT_CONFIGURED',
      daftraLoginEmail: loginEmail,
      daftraLoginUrl: loginUrl,
      lastConnectionError: null,
    };

    const row = await this.prisma.butcherDaftraIntegration.upsert({
      where: { butcherId },
      create: data,
      update: {
        accountIdentifier: data.accountIdentifier,
        apiKeyCiphertext: data.apiKeyCiphertext,
        apiKeyIv: data.apiKeyIv,
        apiKeyTag: data.apiKeyTag,
        apiKeyLast4: data.apiKeyLast4,
        status: data.status,
        daftraLoginEmail: data.daftraLoginEmail,
        daftraLoginUrl: data.daftraLoginUrl,
        lastConnectionError: null,
      },
    });

    await this.appendApplicationComment(adminUserId, butcherId, 'CONFIGURE', {
      accountIdentifier,
      keyUpdated: Boolean(apiKey),
    });

    this.logger.info(
      { butcherId, adminUserId, accountIdentifier },
      'Daftra integration configured',
    );

    return toPublicStatus(butcherId, row);
  }

  async testConnection(
    adminUserId: string,
    butcherId: string,
    input: TestDaftraInput = {},
  ): Promise<{
    status: DaftraPublicStatus;
    connected: boolean;
    reason?: string;
    messageAr: string;
  }> {
    await this.assertButcherExists(butcherId);
    const row = await this.prisma.butcherDaftraIntegration.findUnique({
      where: { butcherId },
    });
    if (!row) {
      throwApi(400, 'not_configured', 'تكامل دفترة غير معدّ لهذه الملحمة');
    }

    let apiKey: string;
    try {
      apiKey = decryptSecret({
        ciphertext: row.apiKeyCiphertext,
        iv: row.apiKeyIv,
        tag: row.apiKeyTag,
      });
    } catch {
      this.logger.warn({ butcherId }, 'Daftra API key decrypt failed');
      throwApi(500, 'decrypt_failed', 'تعذر قراءة إعدادات التكامل');
    }

    const result = await testDaftraConnection({
      accountIdentifier: row.accountIdentifier,
      apiKey,
    });

    const nextStatus: DaftraIntegrationStatus = result.connected
      ? 'CONNECTED'
      : 'CONNECTION_FAILED';

    const updated = await this.prisma.butcherDaftraIntegration.update({
      where: { butcherId },
      data: {
        status: nextStatus,
        lastConnectionTestAt: new Date(),
        lastConnectionError: result.connected ? null : result.safeReason,
      },
    });

    await this.appendApplicationComment(adminUserId, butcherId, 'TEST', {
      ok: result.connected,
      reason: result.connected ? 'CONNECTED' : result.reason,
      httpStatus: result.httpStatus,
    });

    this.logger.info(
      { butcherId, adminUserId, connected: result.connected },
      'Daftra connection tested',
    );

    if (result.connected && input.sendInvite) {
      await this.sendInviteEmail(updated, input.invitePassword);
    }

    return {
      status: toPublicStatus(butcherId, updated),
      connected: result.connected,
      reason: result.connected ? undefined : result.reason,
      messageAr: result.connected
        ? 'تم الاتصال بحساب دفترة بنجاح.'
        : `تعذر الاتصال بحساب دفترة. ${result.safeReason}`,
    };
  }

  async disable(
    adminUserId: string,
    butcherId: string,
  ): Promise<DaftraPublicStatus> {
    await this.assertButcherExists(butcherId);
    const row = await this.prisma.butcherDaftraIntegration.findUnique({
      where: { butcherId },
    });
    if (!row) {
      throwApi(400, 'not_configured', 'تكامل دفترة غير معدّ لهذه الملحمة');
    }

    const updated = await this.prisma.butcherDaftraIntegration.update({
      where: { butcherId },
      data: { status: 'DISABLED' },
    });

    await this.appendApplicationComment(adminUserId, butcherId, 'DISABLE', {});
    this.logger.info({ butcherId, adminUserId }, 'Daftra integration disabled');
    return toPublicStatus(butcherId, updated);
  }

  async statusForOwner(user: JwtPayload) {
    const butcherId = await this.requireOwnedButcherId(user);
    return this.getStatus(butcherId);
  }

  async testConnectionForOwner(user: JwtPayload) {
    const butcherId = await this.requireOwnedButcherId(user);
    return this.testConnection(user.userId, butcherId);
  }

  async listProducts(
    butcherId: string,
    query: { page?: number; limit?: number; search?: string } = {},
  ): Promise<DaftraProductPage> {
    const client = await this.clientForButcher(butcherId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(
      DAFTRA_PRODUCT_PAGE_MAX,
      Math.max(1, query.limit ?? DAFTRA_PRODUCT_PAGE_DEFAULT),
    );
    try {
      const res = await client.get(DAFTRA_PATHS.products, {
        page,
        limit,
        search: query.search,
      });
      return mapDaftraProductPage(res.body);
    } catch (err) {
      this.rethrowDaftra(err);
    }
  }

  async getProduct(
    butcherId: string,
    daftraProductId: number,
  ): Promise<DaftraProduct> {
    const client = await this.clientForButcher(butcherId);
    try {
      const res = await client.get(DAFTRA_PATHS.product(daftraProductId));
      const mapped = mapDaftraProduct(
        (res.body as { data?: unknown }).data ?? res.body,
      );
      if (!mapped) {
        throwApi(404, 'not_found', 'المنتج غير موجود في حساب دفترة');
      }
      return mapped;
    } catch (err) {
      this.rethrowDaftra(err);
    }
  }

  async listInventory(
    butcherId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<{
    items: DaftraProductStock[];
    page: number;
    pageCount: number;
    totalResults: number;
  }> {
    const page = await this.listProducts(butcherId, query);
    return {
      page: page.page,
      pageCount: page.pageCount,
      totalResults: page.totalResults,
      items: page.items.map((product) => ({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
        trackStock: product.trackStock,
        source: 'stock_balance' as const,
        levels: [],
      })),
    };
  }

  async getProductStock(
    butcherId: string,
    daftraProductId: number,
  ): Promise<DaftraProductStock> {
    const client = await this.clientForButcher(butcherId);
    try {
      const res = await client.get(DAFTRA_PATHS.product(daftraProductId));
      const mapped = mapDaftraProductStock(res.body);
      if (!mapped) {
        throwApi(404, 'not_found', 'المخزون غير متاح لهذا المنتج');
      }
      return mapped;
    } catch (err) {
      this.rethrowDaftra(err);
    }
  }

  /**
   * Write helpers for a later butcher-dashboard catalog flow.
   * Not wired to Sarh ButcherProduct CRUD.
   */
  async createRemoteProduct(
    butcherId: string,
    product: Record<string, unknown>,
  ): Promise<DaftraProduct> {
    const client = await this.clientForButcher(butcherId);
    try {
      const res = await client.post(DAFTRA_PATHS.products, {
        Product: product,
      });
      const mapped = mapDaftraProduct(
        (res.body as { data?: unknown }).data ?? res.body,
      );
      if (!mapped) throwApi(502, 'invalid_response', 'استجابة دفترة غير صالحة');
      return mapped;
    } catch (err) {
      this.rethrowDaftra(err);
    }
  }

  async updateRemoteProduct(
    butcherId: string,
    daftraProductId: number,
    product: Record<string, unknown>,
  ): Promise<DaftraProduct> {
    const client = await this.clientForButcher(butcherId);
    try {
      const res = await client.put(DAFTRA_PATHS.product(daftraProductId), {
        Product: product,
      });
      const mapped = mapDaftraProduct(
        (res.body as { data?: unknown }).data ?? res.body,
      );
      if (!mapped) throwApi(502, 'invalid_response', 'استجابة دفترة غير صالحة');
      return mapped;
    } catch (err) {
      this.rethrowDaftra(err);
    }
  }

  async listProductLinks(butcherId: string) {
    await this.assertButcherExists(butcherId);
    return this.prisma.butcherDaftraProduct.findMany({
      where: { butcherId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async linkProduct(butcherId: string, input: LinkDaftraProductInput) {
    const remote = await this.getProduct(butcherId, input.daftraProductId);
    if (input.sarhProductId) {
      const local = await this.prisma.butcherProduct.findFirst({
        where: {
          id: input.sarhProductId,
          butcherId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!local) {
        throwApi(404, 'product_not_found', 'منتج سرح غير موجود لهذه الملحمة');
      }
    }

    return this.prisma.butcherDaftraProduct.upsert({
      where: {
        butcherId_daftraProductId: {
          butcherId,
          daftraProductId: input.daftraProductId,
        },
      },
      create: {
        butcherId,
        daftraProductId: input.daftraProductId,
        sarhProductId: input.sarhProductId ?? null,
        daftraProductCode: remote.sku,
        lastKnownQuantity: remote.quantity,
        lastSyncedAt: new Date(),
      },
      update: {
        sarhProductId: input.sarhProductId ?? null,
        daftraProductCode: remote.sku,
        lastKnownQuantity: remote.quantity,
        lastSyncedAt: new Date(),
      },
    });
  }

  async requireOwnedButcherId(user: JwtPayload): Promise<string> {
    const butcher = await this.prisma.butcher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!butcher) throwApi(403, 'not_butcher', 'هذا الحساب ليس ملحمة');
    return butcher.id;
  }

  private async clientForButcher(butcherId: string): Promise<DaftraClient> {
    await this.assertButcherExists(butcherId);
    const row = await this.prisma.butcherDaftraIntegration.findUnique({
      where: { butcherId },
    });
    if (!row) {
      throwApi(400, 'not_configured', 'تكامل دفترة غير معدّ لهذه الملحمة');
    }
    if (row.status === 'DISABLED') {
      throwApi(409, 'disabled', 'تكامل دفترة معطّل لهذه الملحمة');
    }
    let apiKey: string;
    try {
      apiKey = decryptSecret({
        ciphertext: row.apiKeyCiphertext,
        iv: row.apiKeyIv,
        tag: row.apiKeyTag,
      });
    } catch {
      this.logger.warn({ butcherId }, 'Daftra API key decrypt failed');
      throwApi(500, 'decrypt_failed', 'تعذر قراءة إعدادات التكامل');
    }
    return createDaftraClient({
      accountIdentifier: row.accountIdentifier,
      apiKey,
    });
  }

  private rethrowDaftra(err: unknown): never {
    if (isDaftraRequestError(err)) {
      const status =
        err.reason === 'INVALID_API_KEY'
          ? 401
          : err.reason === 'NOT_FOUND'
            ? 404
            : err.reason === 'RATE_LIMITED'
              ? 429
              : 502;
      throwApi(status, err.reason.toLowerCase(), err.safeMessage);
    }
    throw err;
  }

  private async assertButcherExists(butcherId: string): Promise<void> {
    const butcher = await this.prisma.butcher.findUnique({
      where: { id: butcherId },
      select: { id: true },
    });
    if (!butcher) throwApi(404, 'not_found', 'الملحمة غير موجودة');
  }

  private async appendApplicationComment(
    adminUserId: string,
    butcherId: string,
    kind: 'CONFIGURE' | 'TEST' | 'DISABLE',
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const butcher = await this.prisma.butcher.findUnique({
      where: { id: butcherId },
      select: { sourceApplicationId: true },
    });
    if (!butcher?.sourceApplicationId) return;
    try {
      await this.prisma.$transaction(async (tx) => {
        await appendTimelineEvent(tx, {
          applicationId: butcher.sourceApplicationId!,
          action: 'COMMENT',
          createdBy: adminUserId,
          comment: `daftra_${kind.toLowerCase()}`,
          metadata: { kind: `DAFTRA_${kind}`, ...metadata },
        });
      });
    } catch (err) {
      this.logger.warn(
        {
          err: err instanceof Error ? err.message : 'timeline_failed',
          butcherId,
        },
        'Daftra timeline comment failed',
      );
    }
  }

  private async sendInviteEmail(
    row: {
      daftraLoginEmail: string | null;
      daftraLoginUrl: string | null;
      butcherId: string;
    },
    invitePassword?: string,
  ): Promise<void> {
    const to = row.daftraLoginEmail?.trim();
    const loginUrl = row.daftraLoginUrl?.trim();
    if (!to || !loginUrl) {
      this.logger.info(
        { butcherId: row.butcherId },
        'Daftra invite skipped — login email/url missing',
      );
      return;
    }

    const passwordLine = invitePassword?.trim()
      ? `\nكلمة المرور المؤقتة: ${invitePassword.trim()}\nيُفضّل تغييرها بعد أول دخول.`
      : '';

    await this.emailQueue.addEmail({
      to,
      subject: 'تم تجهيز حساب دفترة لمنصة سرح',
      template: 'butcher_daftra_ready',
      variables: {
        loginUrl,
        loginEmail: to,
        passwordLine,
      },
    });
  }
}
