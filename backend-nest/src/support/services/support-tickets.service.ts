import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { throwApi } from '../../common/exceptions/api.exception';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';
import { SupportRepository } from '../repositories/support.repository';
import { SupportNotificationsService } from './support-notifications.service';
import type {
  CreateSupportTicketDto,
  ReplySupportTicketDto,
} from '../dto/support.dto';
import {
  SUPPORT_TICKET_CATEGORY_LABEL_AR,
  TICKET_STATUS_LABEL_AR,
} from '../constants/support.constants';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
});

const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['SUPPORT', 'REPORT']).optional(),
});

const adminUpdateTicketSchema = z
  .object({
    status: z
      .enum([
        'OPEN',
        'IN_REVIEW',
        'IN_PROGRESS',
        'AWAITING_USER',
        'RESOLVED',
        'CLOSED',
      ])
      .optional(),
    adminNotes: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    assignedToId: z.string().uuid().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'empty_update' });

const adminReplySchema = z.object({
  body: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
  attachments: z
    .array(
      z.object({
        fileUrl: z.string().url(),
        fileName: z.string().optional(),
        mimeType: z.string().optional(),
        fileSizeBytes: z.number().int().optional(),
      }),
    )
    .max(8)
    .optional(),
});

@Injectable()
export class SupportTicketsService {
  constructor(
    private readonly repo: SupportRepository,
    private readonly notifications: SupportNotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  private ticketNumber() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `SUP-${stamp}-${rand}`;
  }

  getMeta() {
    return {
      categories: Object.entries(SUPPORT_TICKET_CATEGORY_LABEL_AR).map(
        ([value, labelAr]) => ({ value, labelAr }),
      ),
      statuses: Object.entries(TICKET_STATUS_LABEL_AR).map(([value, labelAr]) => ({
        value,
        labelAr,
      })),
    };
  }

  async listUserTickets(user: JwtPayload, query: Record<string, unknown>) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) throwApi(400, 'invalid_query', 'معاملات غير صالحة');
    const { page, pageSize, status } = parsed.data;
    return this.repo.listUserTickets(user.userId, page, pageSize, status);
  }

  async getUserTicket(user: JwtPayload, id: string) {
    const ticket = await this.repo.findUserTicket(id, user.userId);
    if (!ticket) throwApi(404, 'not_found', 'التذكرة غير موجودة');
    return { ticket };
  }

  async createTicket(user: JwtPayload, dto: CreateSupportTicketDto) {
    const ticket = await this.repo.createTicket({
      ticketNumber: this.ticketNumber(),
      type: 'SUPPORT',
      category: dto.category,
      subject: dto.subject.trim(),
      description: dto.description.trim(),
      status: 'OPEN',
      reporter: { connect: { id: user.userId } },
      attachments: dto.attachments?.length
        ? {
            create: dto.attachments.map((a) => ({
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              mimeType: a.mimeType,
              fileSizeBytes: a.fileSizeBytes,
            })),
          }
        : undefined,
    });

    await this.notifications.notifyTicketCreated(user.userId, {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
    });

    return {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    };
  }

  async replyAsUser(user: JwtPayload, ticketId: string, dto: ReplySupportTicketDto) {
    const ticket = await this.repo.findUserTicket(ticketId, user.userId);
    if (!ticket) throwApi(404, 'not_found', 'التذكرة غير موجودة');
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      throwApi(400, 'ticket_closed', 'لا يمكن الرد على تذكرة مغلقة');
    }

    const message = await this.repo.createMessage({
      ticket: { connect: { id: ticketId } },
      author: { connect: { id: user.userId } },
      body: dto.body.trim(),
      isStaffReply: false,
      attachments: dto.attachments?.length
        ? {
            create: dto.attachments.map((a) => ({
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              mimeType: a.mimeType,
              fileSizeBytes: a.fileSizeBytes,
              ticket: { connect: { id: ticketId } },
            })),
          }
        : undefined,
    });

    const updated = await this.repo.updateTicket(ticketId, {
      status: ticket.status === 'AWAITING_USER' ? 'IN_PROGRESS' : ticket.status,
    });

    await this.notifications.notifyUserReply({
      id: updated.id,
      ticketNumber: updated.ticketNumber,
      subject: updated.subject,
    });

    return { message, ticket: updated };
  }

  async listAdminTickets(query: Record<string, unknown>) {
    const parsed = adminListQuerySchema.safeParse(query);
    if (!parsed.success) throwApi(400, 'invalid_query', 'معاملات غير صالحة');
    return this.repo.listAdminTickets(parsed.data);
  }

  async getAdminTicket(id: string) {
    const ticket = await this.repo.findTicketById(id);
    if (!ticket) throwApi(404, 'not_found', 'التذكرة غير موجودة');
    return { ticket };
  }

  async updateAdminTicket(id: string, body: Record<string, unknown>) {
    const parsed = adminUpdateTicketSchema.safeParse(body);
    if (!parsed.success) throwApi(400, 'invalid_body', 'بيانات غير صالحة');

    const existing = await this.repo.findTicketById(id);
    if (!existing) throwApi(404, 'not_found', 'التذكرة غير موجودة');

    const ticket = await this.repo.updateTicket(id, parsed.data);

    if (existing.reporterId && parsed.data.status && parsed.data.status !== existing.status) {
      if (parsed.data.status === 'AWAITING_USER') {
        await this.notifications.notifyTicketAwaitingUser(existing.reporterId, {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
        });
      } else if (parsed.data.status === 'CLOSED') {
        await this.notifications.notifyTicketClosed(existing.reporterId, {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
        });
      } else {
        await this.notifications.notifyTicketStatusChanged(existing.reporterId, {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: parsed.data.status,
        });
      }
    }

    return { ticket };
  }

  async replyAsStaff(staff: JwtPayload, ticketId: string, body: Record<string, unknown>) {
    const parsed = adminReplySchema.safeParse(body);
    if (!parsed.success) throwApi(400, 'invalid_body', 'بيانات غير صالحة');

    const ticket = await this.repo.findTicketById(ticketId);
    if (!ticket) throwApi(404, 'not_found', 'التذكرة غير موجودة');

    if (parsed.data.isInternal) {
      const mergedNotes = [ticket.adminNotes, parsed.data.body.trim()]
        .filter(Boolean)
        .join('\n\n');
      const updated = await this.repo.updateTicket(ticketId, { adminNotes: mergedNotes });
      return { ticket: updated, internal: true };
    }

    const message = await this.repo.createMessage({
      ticket: { connect: { id: ticketId } },
      author: { connect: { id: staff.userId } },
      body: parsed.data.body.trim(),
      isStaffReply: true,
      attachments: parsed.data.attachments?.length
        ? {
            create: parsed.data.attachments.map((a) => ({
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              mimeType: a.mimeType,
              fileSizeBytes: a.fileSizeBytes,
              ticket: { connect: { id: ticketId } },
            })),
          }
        : undefined,
    });

    const newStatus =
      ticket.status === 'OPEN' || ticket.status === 'IN_REVIEW'
        ? 'IN_PROGRESS'
        : ticket.status;

    const updated = await this.repo.updateTicket(ticketId, { status: newStatus });

    if (ticket.reporterId) {
      await this.notifications.notifyStaffReply(ticket.reporterId, {
        id: updated.id,
        ticketNumber: updated.ticketNumber,
      });
    }

    return { message, ticket: updated };
  }

  async listAssignableStaff() {
    const staff = await this.repo.findAllStaffUserIds();
    const users = await this.prisma.user.findMany({
      where: { id: { in: staff.map((s) => s.id) } },
      select: {
        id: true,
        username: true,
        displayName: true,
        arabicName: true,
        role: true,
      },
    });
    return { staff: users };
  }
}
