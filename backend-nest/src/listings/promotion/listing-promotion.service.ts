import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwApi } from '../../common/exceptions/api.exception';
import { LoggerService } from '../../common/services/logger.service';
import { AppNotificationsService } from '../../queue/services/app-notifications.service';
import { RedisCacheService } from '../../redis/services/redis-cache.service';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';
import { createNiCheckout, isNiSandboxMockMode } from '../../payments/ni-client';
import {
  PROMOTE_AMOUNT_MAX,
  PROMOTE_AMOUNT_MIN,
  PROMOTE_DURATION_HOURS_MAX,
  PROMOTE_DURATION_HOURS_MIN,
  clampPromoteAmount,
  clampPromoteDurationHours,
  durationDaysFromHours,
} from './promotion-limits.config';

import {
  PROMOTION_PLANS,
  PROMOTION_TIERS,
  promotionTierWeight,
  type PromotionTierKey,
} from './promotion-tiers.config';

import {
  promotionPriceForHours,
  PROMOTION_DEFAULT_BASE_PER_24H,
} from '../boost/boost-pricing.util';

type InitiatePromotionOptions = {
  durationDays?: number;
  durationHours?: number;
  /** Ignored for visibility — price is server-computed. Kept for API compatibility. */
  amount?: number;
  method: string;
  tier?: PromotionTierKey;
  promotionGoal?: 'visibility' | 'pinned' | 'featured';
};

function buildOrderRef(userId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const uid = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `PRM-${uid}-${ts}`;
}

@Injectable()
export class ListingPromotionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly notifications: AppNotificationsService,
    private readonly cache: RedisCacheService,
  ) {}

  getPromotionPlans() {
    return {
      tiers: Object.values(PROMOTION_TIERS),
      plans: PROMOTION_PLANS,
    };
  }

  private async getPromotionBase(): Promise<number> {
    try {
      const s = await this.prisma.appSetting.findUnique({ where: { key: 'pricing.promotion.per24h' } });
      if (s && typeof s.value === 'number' && s.value > 0) return s.value;
    } catch { /* fall through */ }
    return PROMOTION_DEFAULT_BASE_PER_24H;
  }

  async expireStalePromotions() {
    const now = new Date();
    const expired = await this.prisma.listingPromotion.findMany({
      where: { status: 'paid', expiresAt: { lt: now } },
      select: { id: true, listingId: true },
      take: 200,
    });

    if (expired.length === 0) return;

    const listingIds = [...new Set(expired.map((row) => row.listingId))];

    await this.prisma.$transaction([
      this.prisma.listingPromotion.updateMany({
        where: { id: { in: expired.map((row) => row.id) } },
        data: { status: 'overdue' },
      }),
      ...listingIds.map((listingId) =>
        this.prisma.listing.update({
          where: { id: listingId },
          data: {
            promoted: false,
            promotedUntil: null,
            promotionWeight: 0,
            promotionTier: null,
          },
        }),
      ),
    ]);

    await this.cache.delPattern('listings:v2:*').catch(() => {});
    for (const id of listingIds) {
      await this.cache.del(`listing:${id}`).catch(() => {});
    }
  }

  async initiatePromotion(
    user: JwtPayload,
    listingId: string,
    options: InitiatePromotionOptions,
  ) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId: user.userId, deletedAt: null },
      select: { id: true, arabicTitle: true, status: true, views: true },
    });
    if (!listing) throwApi(404, 'listing_not_found', 'الإعلان غير موجود');

    const tier = options.tier ?? 'standard';
    const tierConfig = PROMOTION_TIERS[tier] ?? PROMOTION_TIERS.standard;

    let durationHours: number;
    let durationDays: number;
    let amount: number;

    if (options.durationHours != null) {
      durationHours = clampPromoteDurationHours(options.durationHours);
      durationDays = durationDaysFromHours(durationHours);
      // Server computes price — user-supplied amount is validated as minimum but ignored for final charge
      const base = await this.getPromotionBase();
      amount = promotionPriceForHours(durationHours, base);
    } else if (options.durationDays != null && options.durationDays > 0) {
      durationDays = options.durationDays;
      durationHours = durationDays * 24;
      const base = await this.getPromotionBase();
      amount = promotionPriceForHours(durationHours, base);
    } else {
      throwApi(400, 'invalid_duration', 'مدة الترويج غير صالحة');
    }

    // Allow user to pay more than the minimum (higher budget = more reach)
    if (options.amount != null && options.amount > amount) {
      amount = clampPromoteAmount(options.amount);
    }

    if (amount < PROMOTE_AMOUNT_MIN || amount > PROMOTE_AMOUNT_MAX) {
      throwApi(400, 'invalid_amount', 'المبلغ غير صالح');
    }
    if (durationHours < PROMOTE_DURATION_HOURS_MIN || durationHours > PROMOTE_DURATION_HOURS_MAX) {
      throwApi(400, 'invalid_duration', 'مدة الترويج غير صالحة');
    }

    const currency = 'SAR';
    const orderRef = buildOrderRef(user.userId);
    const descriptionAr = `ترويج إعلان: ${listing.arabicTitle} — ${durationHours} ساعة (${amount} ر.س)`;

    const prismaMethod = ['mada', 'visa', 'mastercard', 'apple_pay', 'stc_pay'].includes(
      options.method,
    )
      ? (options.method as 'mada' | 'visa' | 'mastercard' | 'apple_pay' | 'stc_pay')
      : 'visa';

    const niMethod = this.mapMethod(options.method);

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    const promotionGoal = options.promotionGoal ?? 'visibility';

    const { promotion, payment } = await this.prisma.$transaction(async (tx) => {
      const promotion = await tx.listingPromotion.create({
        data: {
          listingId,
          userId: user.userId,
          tier: tierConfig.key,
          weight: tierConfig.weight,
          durationDays,
          amount,
          currency,
          status: 'pending',
          baselineViews: listing.views ?? 0,
        },
      });

      const payment = await tx.payment.create({
        data: {
          userId: user.userId,
          orderId: orderRef,
          amount,
          currency,
          method: prismaMethod,
          status: 'pending',
          referenceId: promotion.id,
          referenceType: 'promoted_ad',
          descriptionAr,
          description: descriptionAr,
          metadata: {
            promotionId: promotion.id,
            listingId,
            tier: tierConfig.key,
            userId: user.userId,
            durationDays,
            durationHours,
            promotionGoal,
            promotionAmount: amount,
            promotionDurationHours: durationHours,
            totalAmount: amount,
            adId: listingId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            referenceType: 'promoted_ad',
          } as Prisma.InputJsonValue,
        },
      });

      return { promotion, payment };
    });

    let checkoutUrl: string;

    if (isNiSandboxMockMode()) {
      checkoutUrl = `https://sandbox.network.ae/demo/${orderRef}`;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { checkoutUrl, transactionId: `DEV-${orderRef}` },
      });
    } else {
      const contact = await this.prisma.user.findUnique({
        where: { id: user.userId },
        select: { email: true, displayName: true, arabicName: true },
      });
      const appUrl = process.env.APP_URL ?? 'https://sarh-app.up.railway.app';

      try {
        const { checkoutUrl: niUrl, niOrderReference } = await createNiCheckout({
          amount,
          currency,
          orderReference: orderRef,
          description: descriptionAr,
          redirectUrl: `${appUrl}/payment/result?paymentId=${payment.id}&context=promotion&listingId=${listingId}`,
          cancelUrl: `${appUrl}/payment/cancel`,
          firstName: contact?.displayName ?? contact?.arabicName ?? 'Customer',
          email: contact?.email ?? '',
          paymentMethods: [niMethod],
          customData: {
            paymentId: payment.id,
            promotionId: promotion.id,
            listingId,
            tier: tierConfig.key,
            userId: user.userId,
            referenceType: 'promoted_ad',
          },
        });

        checkoutUrl = niUrl;
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { checkoutUrl, transactionId: niOrderReference },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error({ err: message, promotionId: promotion.id }, 'NI promotion checkout failed');
        throwApi(502, 'payment_gateway_error', 'تعذر الاتصال ببوابة الدفع');
      }
    }

    return {
      promotionId: promotion.id,
      paymentId: payment.id,
      orderId: orderRef,
      checkoutUrl,
      amount,
      currency,
      devMode: isNiSandboxMockMode(),
    };
  }

  async fulfillPromotion(promotionId: string, niTransactionId: string) {
    const promotion = await this.prisma.listingPromotion.findUnique({
      where: { id: promotionId },
      include: { listing: { select: { arabicTitle: true, views: true } } },
    });
    if (!promotion || promotion.status === 'paid') return { processed: false };

    const now = new Date();
    const payment = await this.prisma.payment.findFirst({
      where: { referenceId: promotionId, referenceType: 'promoted_ad' },
      select: { metadata: true },
    });
    const meta = (payment?.metadata ?? {}) as Record<string, unknown>;
    const durationHours =
      typeof meta.durationHours === 'number' && meta.durationHours > 0
        ? meta.durationHours
        : promotion.durationDays * 24;
    const expires = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    const weight = promotion.weight || promotionTierWeight(promotion.tier);

    await this.prisma.$transaction([
      this.prisma.listingPromotion.update({
        where: { id: promotionId },
        data: {
          status: 'paid',
          paidAt: now,
          transactionId: niTransactionId,
          startsAt: now,
          expiresAt: expires,
          baselineViews: promotion.listing?.views ?? promotion.baselineViews,
        },
      }),
      this.prisma.listing.update({
        where: { id: promotion.listingId },
        data: {
          promoted: true,
          promotedUntil: expires,
          promotionWeight: weight,
          promotionTier: promotion.tier,
        },
      }),
    ]);

    await this.notifications.notifyUser({
      userId: promotion.userId,
      type: 'system',
      titleAr: '🚀 تم تفعيل ترويج إعلانك',
      bodyAr: `إعلانك "${promotion.listing?.arabicTitle ?? ''}" أصبح مروجاً حتى ${expires.toLocaleDateString('ar-SA')}.`,
      data: { promotionId, listingId: promotion.listingId },
    });

    await this.cache.delPattern('listings:v2:*').catch(() => {});
    await this.cache.del(`listing:${promotion.listingId}`).catch(() => {});

    return {
      processed: true,
      promotion: {
        id: promotionId,
        listingId: promotion.listingId,
        expiresAt: expires,
      },
    };
  }

  async devCompletePromotion(user: JwtPayload, promotionId: string) {
    if (!isNiSandboxMockMode()) throwApi(403, 'forbidden', 'غير متاح في الإنتاج');

    const promotion = await this.prisma.listingPromotion.findFirst({
      where: { id: promotionId, userId: user.userId },
    });
    if (!promotion) throwApi(404, 'not_found', 'الترويج غير موجود');
    if (promotion.status === 'paid') return { promotionId, status: 'paid' };

    await this.prisma.payment.updateMany({
      where: { referenceId: promotionId, status: 'pending' },
      data: { status: 'paid', paidAt: new Date(), transactionId: `DEV-${promotionId}` },
    });

    await this.fulfillPromotion(promotionId, `DEV-${promotionId}`);
    return { promotionId, status: 'paid' };
  }

  async getPromotionStats(user: JwtPayload, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId: user.userId, deletedAt: null },
      select: { id: true, views: true, promoted: true, promotedUntil: true, promotionTier: true },
    });
    if (!listing) throwApi(404, 'listing_not_found', 'الإعلان غير موجود');

    const active = await this.prisma.listingPromotion.findFirst({
      where: { listingId, status: 'paid', expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });

    const baseline = active?.baselineViews ?? 0;
    const currentViews = listing.views ?? 0;
    const promotedViews = active?.promotedViews ?? 0;
    const impressions = active?.impressions ?? 0;
    const clicks = active?.clicks ?? 0;
    const viewsDelta = Math.max(0, currentViews - baseline);
    const increasePercent =
      baseline > 0 ? Math.round((viewsDelta / baseline) * 100) : viewsDelta > 0 ? 100 : 0;

    const remainingMs = active?.expiresAt
      ? Math.max(0, active.expiresAt.getTime() - Date.now())
      : 0;

    return {
      listingId,
      isPromoted: listing.promoted && remainingMs > 0,
      tier: active?.tier ?? listing.promotionTier ?? null,
      impressions,
      clicks,
      promotedViews,
      viewsIncreasePercent: increasePercent,
      remainingMs,
      expiresAt: active?.expiresAt ?? listing.promotedUntil ?? null,
      startsAt: active?.startsAt ?? null,
    };
  }

  async trackPromotionEvent(
    listingId: string,
    event: 'impression' | 'click' | 'view',
  ) {
    const active = await this.prisma.listingPromotion.findFirst({
      where: {
        listingId,
        status: 'paid',
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
      select: { id: true },
    });
    if (!active) return { tracked: false };

    const data =
      event === 'impression'
        ? { impressions: { increment: 1 } }
        : event === 'click'
          ? { clicks: { increment: 1 } }
          : { promotedViews: { increment: 1 } };

    await this.prisma.listingPromotion.update({
      where: { id: active.id },
      data,
    });

    return { tracked: true };
  }

  private mapMethod(method: string): string {
    switch (method) {
      case 'mada':
        return 'MADA';
      case 'apple_pay':
        return 'APPLE_PAY';
      case 'stc_pay':
        return 'STC_PAY';
      default:
        return 'CARD';
    }
  }
}
