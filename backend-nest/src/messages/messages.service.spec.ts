import { MessagesService } from './messages.service';
import { ApiException } from '../common/exceptions/api.exception';

describe('MessagesService.sendMessage block enforcement', () => {
  const repo = {
    upsertThread: jest.fn(),
    createMessage: jest.fn(),
  };
  const policy = {
    assertCanSendMessage: jest.fn(),
  };
  const logger = { info: jest.fn() };
  const notifications = { notifyUser: jest.fn() };

  let service: MessagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessagesService(
      repo as never,
      logger as never,
      notifications as never,
      policy as never,
    );
  });

  it('does not persist a REST message when the policy rejects a block', async () => {
    policy.assertCanSendMessage.mockRejectedValue(
      new ApiException(403, 'blocked', 'لا يمكنك مراسلة هذا المستخدم'),
    );

    await expect(
      service.sendMessage(
        { userId: 'blocked', username: 'b', role: 'USER' },
        { receiverId: 'victim', text: 'hi' },
      ),
    ).rejects.toMatchObject({ status: 403, error: 'blocked' });

    expect(repo.createMessage).not.toHaveBeenCalled();
    expect(repo.upsertThread).not.toHaveBeenCalled();
  });
});
