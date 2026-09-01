import { SocketGatewayService } from './socket-gateway.service';
import { ApiException } from '../../common/exceptions/api.exception';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';

function user(id: string): JwtPayload {
  return { userId: id, username: id, role: 'USER' };
}

describe('SocketGatewayService chat authorization', () => {
  const repo = {
    isThreadParticipant: jest.fn(),
    findThreadParticipants: jest.fn(),
    createMessageWithThreadUpdate: jest.fn(),
  };
  const messagingPolicy = {
    assertCanSendMessage: jest.fn(),
    assertNotBlocked: jest.fn(),
  };
  const emitService = {
    emitToThread: jest.fn(),
    emitToUser: jest.fn(),
    getServer: jest.fn().mockReturnValue({ to: () => ({ emit: jest.fn() }) }),
  };
  const notifications = { notifyUser: jest.fn() };

  let service: SocketGatewayService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SocketGatewayService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      repo as never,
      notifications as never,
      emitService as never,
      {} as never,
      { error: jest.fn() } as never,
      messagingPolicy as never,
    );
  });

  it('rejects chat:send when sender is not a participant', async () => {
    repo.isThreadParticipant.mockResolvedValue(null);
    const err = await service.handleChatSend(user('eve'), {
      threadId: '11111111-1111-1111-1111-111111111111',
      receiverId: 'bob',
      text: 'hi',
    });
    expect(err?.code).toBe('unauthorized');
    expect(messagingPolicy.assertCanSendMessage).not.toHaveBeenCalled();
  });

  it('rejects chat:send on an existing Customer↔Butcher thread', async () => {
    repo.isThreadParticipant.mockResolvedValue({ id: 't-shop' });
    repo.findThreadParticipants.mockResolvedValue({
      participant1: 'customer',
      participant2: 'butcher-user',
      type: 'BUTCHER',
      butcherId: 'shop-1',
    });
    messagingPolicy.assertCanSendMessage.mockRejectedValue(
      new ApiException(403, 'forbidden', 'التواصل المباشر مع الملحمة غير متاح'),
    );

    const err = await service.handleChatSend(user('customer'), {
      threadId: '11111111-1111-1111-1111-111111111111',
      receiverId: 'butcher-user',
      text: 'still open?',
    });
    expect(err).toEqual({
      code: 'forbidden',
      message: 'التواصل المباشر مع الملحمة غير متاح',
    });
    expect(repo.createMessageWithThreadUpdate).not.toHaveBeenCalled();
  });

  it('rejects chat:send when messaging policy forbids (block/privacy)', async () => {
    repo.isThreadParticipant.mockResolvedValue({ id: 't1' });
    repo.findThreadParticipants.mockResolvedValue({
      participant1: 'alice',
      participant2: 'bob',
      type: 'DIRECT',
      butcherId: null,
    });
    messagingPolicy.assertCanSendMessage.mockRejectedValue(
      new ApiException(403, 'blocked', 'لا يمكنك مراسلة هذا المستخدم'),
    );

    const err = await service.handleChatSend(user('alice'), {
      threadId: '11111111-1111-1111-1111-111111111111',
      receiverId: 'bob',
      text: 'hi',
    });
    expect(err).toEqual({
      code: 'blocked',
      message: 'لا يمكنك مراسلة هذا المستخدم',
    });
    expect(repo.createMessageWithThreadUpdate).not.toHaveBeenCalled();
  });

  it('rejects chat:typing for a non-participant', async () => {
    repo.isThreadParticipant.mockResolvedValue(null);
    const err = await service.handleChatTyping(user('eve'), {
      threadId: '11111111-1111-1111-1111-111111111111',
      receiverId: 'bob',
    });
    expect(err?.code).toBe('unauthorized');
    expect(emitService.getServer).not.toHaveBeenCalled();
  });

  it('rejects chat:typing when parties are blocked', async () => {
    repo.isThreadParticipant.mockResolvedValue({ id: 't1' });
    repo.findThreadParticipants.mockResolvedValue({
      participant1: 'alice',
      participant2: 'bob',
      type: 'DIRECT',
      butcherId: null,
    });
    messagingPolicy.assertNotBlocked.mockRejectedValue(
      new ApiException(403, 'blocked', 'لا يمكنك مراسلة هذا المستخدم'),
    );

    const err = await service.handleChatTyping(user('alice'), {
      threadId: '11111111-1111-1111-1111-111111111111',
      receiverId: 'bob',
    });
    expect(err).toEqual({
      code: 'blocked',
      message: 'لا يمكنك مراسلة هذا المستخدم',
    });
    expect(emitService.getServer).not.toHaveBeenCalled();
  });

  it('rejects chat:typing when receiver is not the other participant', async () => {
    repo.isThreadParticipant.mockResolvedValue({ id: 't1' });
    repo.findThreadParticipants.mockResolvedValue({
      participant1: 'alice',
      participant2: 'bob',
      type: 'DIRECT',
      butcherId: null,
    });

    const err = await service.handleChatTyping(user('alice'), {
      threadId: '11111111-1111-1111-1111-111111111111',
      receiverId: 'stranger',
    });
    expect(err?.code).toBe('unauthorized');
  });
});
