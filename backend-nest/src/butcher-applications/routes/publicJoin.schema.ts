import { z } from 'zod';
import { countrySchema } from '@/lib/countries';
import { HH_MM_REGEX } from '../constants';
import { addSnapshotCrossFieldIssues } from '../helpers/snapshotValidation';

export const publicJoinBodySchema = z
  .object({
    phone: z.string().min(8).max(20),
    phone_token: z.string().min(10),
    displayName: z.string().min(2).max(50).trim(),
    arabicName: z.string().min(2).max(50).trim().optional(),
    email: z.string().email().max(254).toLowerCase().optional(),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9_]+$/, 'أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط')
      .optional(),
    password: z.string().min(6).max(128).optional(),
    acceptedTerms: z.literal(true),
    confirmAccuracy: z.literal(true),
    nameAr: z.string().min(2).max(100).trim(),
    nameEn: z.string().min(2).max(100).trim(),
    shopPhone: z.string().regex(/^\+?[0-9]{8,15}$/, 'رقم هاتف غير صالح'),
    commercialReg: z
      .string()
      .min(5)
      .max(50)
      .regex(/^[A-Za-z0-9\-/]+$/, 'رقم السجل التجاري غير صالح'),
    country: countrySchema,
    city: z.string().min(2).max(100).trim(),
    cityAr: z.string().min(2).max(100).trim(),
    address: z.string().min(5).max(300).trim(),
    addressAr: z.string().min(5).max(300).trim(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    bioAr: z.string().max(1000).trim().optional(),
    bioEn: z.string().max(1000).trim().optional(),
    specialties: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
    openTime: z.string().regex(HH_MM_REGEX, 'صيغة وقت الفتح يجب أن تكون HH:mm'),
    closeTime: z
      .string()
      .regex(HH_MM_REGEX, 'صيغة وقت الإغلاق يجب أن تكون HH:mm'),
  })
  .strict()
  .superRefine((data, ctx) => addSnapshotCrossFieldIssues(data, ctx));

export type PublicJoinBody = z.infer<typeof publicJoinBodySchema>;
