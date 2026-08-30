import { Injectable } from '@nestjs/common';
import { MessageThreadType } from '@prisma/client';
import { throwApi } from '../../common/exceptions/api.exception';
import { MessagesRepository } from '../repositories/messages.repository';

@Injectable()
export class MessagingPolicyService {
  constructor(private readonly repo: MessagesRepository) {}

  async assertNotBlocked(senderId: string, receiverId: string): Promise<void> {
    const [blockedBySender, blockedByReceiver] = await Promise.all([
      this.repo.findBlock(senderId, receiverId),
      this.repo.findBlock(receiverId, senderId),
    ]);
    if (blockedBySender || blockedByReceiver) {
      throwApi(403, 'blocked', 'لا يمكنك مراسلة هذا المستخدم');
    }
  }

  async assertDirectPrivacy(
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    const receiver = await this.repo.findUserById(receiverId);
    if (!receiver) throwApi(404, 'not_found', 'المستخدم غير موجود');

    if (receiver.allowPrivateMessages === false) {
      throwApi(403, 'messages_disabled', 'هذا المستخدم لا يقبل الرسائل الخاصة');
    }
    if (receiver.privateMessagesAudience === 'following') {
      const allowed = await this.repo.findFollow(receiverId, senderId);
      if (!allowed) {
        throwApi(
          403,
          'messages_restricted',
          'هذا المستخدم يقبل الرسائل من الأشخاص الذين يتابعهم فقط',
        );
      }
    }
  }

  async assertButcherChatAllowed(
    senderId: string,
    receiverId: string,
    butcherId: string,
  ): Promise<void> {
    const butcher = await this.repo.findButcherById(butcherId);
    if (!butcher) throwApi(404, 'not_found', 'الملحمة غير موجودة');
    if (butcher.userId !== receiverId && butcher.userId !== senderId) {
      throwApi(400, 'invalid_action', 'المستلم لا يطابق صاحب الملحمة المحددة');
    }

    const customerId =
      butcher.userId === senderId
        ? receiverId
        : butcher.userId === receiverId
          ? senderId
          : null;
    if (!customerId) {
      throwApi(400, 'invalid_action', 'المشاركون لا يطابقان محادثة الملحمة');
    }

    const acceptedOrder = await this.repo.findAcceptedButcherOrderForChat(
      customerId,
      butcher.id,
    );
    if (!acceptedOrder) {
      throwApi(
        403,
        'chat_not_allowed',
        'المحادثة متاحة بعد تقديم الطلب وقبوله من الملحمة',
      );
    }
  }

  async assertCanSendMessage(params: {
    senderId: string;
    receiverId: string;
    type: MessageThreadType;
    butcherId?: string | null;
  }): Promise<void> {
    const { senderId, receiverId, type, butcherId } = params;
    if (receiverId === senderId) {
      throwApi(400, 'invalid_action', 'لا يمكنك مراسلة نفسك');
    }

    await this.assertNotBlocked(senderId, receiverId);

    if (type === 'BUTCHER') {
      if (!butcherId) {
        throwApi(400, 'validation_error', 'معرّف الملحمة مطلوب لمحادثات الملاحم');
      }
      await this.assertButcherChatAllowed(senderId, receiverId, butcherId);
      return;
    }

    await this.assertDirectPrivacy(senderId, receiverId);
  }
}
