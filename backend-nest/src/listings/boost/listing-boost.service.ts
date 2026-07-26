import { Injectable } from '@nestjs/common';
import { BoostType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwApi } from '../../common/exceptions/api.exception';
import { LoggerService } from '../../common/services/logger.service';
import { AppNotificationsService } from '../../queue/services/app-notifications.service';
import { RedisCacheService } from '../../redis/services/redis-cache.service';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';
import { createNiCheckout, isNiSandboxMockMode } from '../../payments/ni-client';

// ─── Pricing table ────────────────────────────────────────────────────────────

export const BOOST_PLANS = {
  pinned: [
    { durationDays: 3, amount: 29, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 59, labelAr: '٧ أيام' },
  ],
  featured: [
    { durationDays: 3, amount: 25, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 49, labelAr: '٧ أيام' },
  ],
  both: [
    { durationDays: 3, amount: 45, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 95, labelAr: '٧ أيام' },
  ],
} as const;

function boostNotificationCopy(boostType: BoostType) {
  if (boostType === 'both') {
    return {
      titleAr: '🚀 تم تثبيت وتمييز إعلانك',
      actionAr: 'مثبّت ومميز',
    };
  }
  if (boostType === 'featured') {
    return { titleAr: '⭐ تم تمييز إعلانك', actionAr: 'مميز' };
  }
  return { titleAr: '📌 تم تثبيت إعلانك', actionAr: 'مثبّت' };
}

function listingBoostListingUpdate(boostType: BoostType, expires: Date) {
  if (boostType === 'featured') {
    return { featured: true, featuredUntil: expires };
  }
  if (boostType === 'pinned') {
    return { pinned: true, pinnedUntil: expires };
  }
  return {
    featured: true,
    featuredUntil: expires,
    pinned: true,
    pinnedUntil: expires,
  };
}

function buildOrderRef(prefix: string, userId: string): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const uid = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `${prefix}-${uid}-${ts}`;
}

@Injectable()
export class ListingBoostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly notifications: AppNotificationsService,
    private readonly cache: RedisCacheService,
  ) {}

  /** Return available boost plans for the frontend. */
  getBoostPlans() {
    return {
      featured: BOOST_PLANS.featured,
      pinned: BOOST_PLANS.pinned,
      both: BOOST_PLANS.both,
    };
  }

  /**
   * Initiate a boost payment for a listing.
   * Creates ListingBoost + Payment records (pending), then calls NI for a checkout URL.
   */
  async initiateBoost(
    user: JwtPayload,
    listingId: string,
    boostType: BoostType,
    durationDays: number,
    method: string,
  ) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId: user.userId, deletedAt: null },
      select: { id: true, arabicTitle: true, status: true },
    });
    if (!listing) throwApi(404, 'listing_not_found', 'الإعلان غير موجود');

    const plans = BOOST_PLANS[boostType as keyof typeof BOOST_PLANS];
    if (!plans) throwApi(400, 'invalid_boost_type', 'نوع الترقية غير صالح');

    const plan = (plans as readonly { durationDays: number; amount: number; labelAr: string }[])
      .find((p) => p.durationDays === durationDays);
    if (!plan) throwApi(400, 'invalid_duration', 'مدة الترقية غير صالحة');

    const amount      = plan.amount;
    const currency    = 'SAR';
    const referenceType =
      boostType === 'pinned' ? 'pinned_ad' : 'featured_ad';
    const orderPrefix =
      boostType === 'pinned' ? 'PIN' : boostType === 'both' ? 'BOTH' : 'FTR';
    const orderRef    = buildOrderRef(orderPrefix, user.userId);

    const descriptionAr =
      boostType === 'featured'
        ? `إعلان مميز: ${listing.arabicTitle} لمدة ${durationDays} يوم`
        : boostType === 'pinned'
          ? `تثبيت إعلان: ${listing.arabicTitle} لمدة ${durationDays} يوم`
          : `تثبيت وتمييز: ${listing.arabicTitle} لمدة ${durationDays} يوم`;

    const niMethod = this.mapMethod(method);

    // Map payment method to Prisma enum
    const prismaMethod = ['mada', 'visa', 'mastercard', 'apple_pay', 'stc_pay'].includes(method)
      ? method as 'mada' | 'visa' | 'mastercard' | 'apple_pay' | 'stc_pay'
      : 'visa';

    // Create boost + payment in a transaction
    const { boost, payment } = await this.prisma.$transaction(async (tx) => {
      const boost = await tx.listingBoost.create({
        data: { listingId, userId: user.userId, boostType, durationDays, amount, currency, status: 'pending' },
      });

      const payment = await tx.payment.create({
        data: {
          userId: user.userId,
          orderId: orderRef,
          amount,
          currency,
          method: prismaMethod,
          status: 'pending',
          referenceId: boost.id,
          referenceType,
          descriptionAr,
          description: descriptionAr,
          metadata: {
            boostId: boost.id,
            listingId,
            boostType,
            userId: user.userId,
            durationDays,
            referenceType,
          } as Prisma.InputJsonValue,
        },
      });

      return { boost, payment };
    });

    let checkoutUrl: string;

    if (isNiSandboxMockMode()) {
      checkoutUrl = `https://sandbox.network.ae/demo/${orderRef}`;
      this.logger.info({ boostId: boost.id, paymentId: payment.id }, 'Boost created in mock mode');
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
          redirectUrl: `${appUrl}/payment/result?paymentId=${payment.id}&context=boost&listingId=${listingId}`,
          cancelUrl: `${appUrl}/payment/cancel`,
          firstName: contact?.displayName ?? contact?.arabicName ?? 'Customer',
          email: contact?.email ?? '',
          paymentMethods: [niMethod],
          customData: {
            paymentId: payment.id,
            boostId: boost.id,
            listingId,
            boostType,
            userId: user.userId,
            referenceType,
          },
        });

        checkoutUrl = niUrl;

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { checkoutUrl, transactionId: niOrderReference },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error({ err: message, boostId: boost.id }, 'NI boost checkout failed');
        throwApi(502, 'payment_gateway_error', 'تعذر الاتصال ببوابة الدفع');
      }
    }

    return {
      boostId:    boost.id,
      paymentId:  payment.id,
      orderId:    orderRef,
      checkoutUrl,
      amount,
      currency,
      devMode: isNiSandboxMockMode(),
    };
  }

  /**
   * Fulfil a boost after NI confirms payment.
   * Called by PaymentsRepository.processSuccessfulPayment via webhook / sync.
   */
  async fulfillBoost(boostId: string, niTransactionId: string) {
    const boost = await this.prisma.listingBoost.findUnique({
      where: { id: boostId },
      include: { listing: { select: { arabicTitle: true } } },
    });
    if (!boost || boost.status === 'paid') return { processed: false };

    const now     = new Date();
    const expires = new Date(now.getTime() + boost.durationDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.listingBoost.update({
        where: { id: boostId },
        data: { status: 'paid', paidAt: now, transactionId: niTransactionId, startsAt: now, expiresAt: expires },
      }),
      this.prisma.listing.update({
        where: { id: boost.listingId },
        data: listingBoostListingUpdate(boost.boostType, expires),
      }),
    ]);

    const { titleAr, actionAr } = boostNotificationCopy(boost.boostType);
    await this.notifications.notifyUser({
      userId: boost.userId,
      type: 'system',
      titleAr,
      bodyAr: `إعلانك "${boost.listing?.arabicTitle}" ${actionAr} حتى ${expires.toLocaleDateString('ar-SA')}.`,
      data: { boostId, listingId: boost.listingId, boostType: boost.boostType },
    });

    this.logger.info({ boostId, boostType: boost.boostType, listingId: boost.listingId }, 'Boost fulfilled');
    await this.cache.delPattern('listings:v2:*').catch(() => {});
    await this.cache.del(`listing:${boost.listingId}`).catch(() => {});
    return { processed: true, boost: { id: boostId, boostType: boost.boostType, listingId: boost.listingId, expiresAt: expires } };
  }

  /** Dev-only: simulate boost payment without NI. */
  async devCompleteBoost(user: JwtPayload, boostId: string) {
    if (!isNiSandboxMockMode()) throwApi(403, 'forbidden', 'غير متاح في الإنتاج');

    const boost = await this.prisma.listingBoost.findFirst({
      where: { id: boostId, userId: user.userId },
    });
    if (!boost) throwApi(404, 'not_found', 'الترقية غير موجودة');

    if (boost.status === 'paid') return { boostId, status: 'paid' };

    // Also mark the Payment as paid
    await this.prisma.payment.updateMany({
      where: { referenceId: boostId, status: 'pending' },
      data: { status: 'paid', paidAt: new Date(), transactionId: `DEV-${boostId}` },
    });

    await this.fulfillBoost(boostId, `DEV-${boostId}`);
    return { boostId, status: 'paid' };
  }

  /** Return active boosts for a given listing. */
  async getListingBoosts(listingId: string) {
    const boosts = await this.prisma.listingBoost.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, boostType: true, durationDays: true, amount: true, status: true, startsAt: true, expiresAt: true, paidAt: true },
    });
    return { boosts };
  }

  private mapMethod(method: string): string {
    switch (method) {
      case 'mada':       return 'MADA';
      case 'apple_pay':  return 'APPLE_PAY';
      case 'stc_pay':    return 'STC_PAY';
      default:           return 'CARD';
    }
  }
}
