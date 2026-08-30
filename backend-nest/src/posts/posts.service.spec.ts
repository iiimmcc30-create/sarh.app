import { PostsService } from './posts.service';

function post(id: string, authorId: string) {
  return {
    id,
    authorId,
    content: 'x',
    arabicContent: 'س',
    author: { id: authorId },
    _count: { likes: 0, reposts: 0, comments: 0 },
  };
}

describe('PostsService feed cache isolation', () => {
  const repo = {
    findFeed: jest.fn(),
    findFollowingIds: jest.fn(),
    findLikesByUser: jest.fn(),
    findRepostsByUser: jest.fn(),
    findById: jest.fn(),
    findLike: jest.fn(),
    findRepost: jest.fn(),
  };
  const usersRepo = {
    findBlockedRelationshipIds: jest.fn(),
  };
  const cache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPattern: jest.fn(),
  };
  const notifications = { notifyUsers: jest.fn() };

  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(
      repo as never,
      usersRepo as never,
      cache as never,
      notifications as never,
    );
  });

  it('does not return another viewer\'s liked flags from a shared cache entry', async () => {
    cache.get.mockResolvedValue({
      posts: [post('p1', 'author-1')],
      nextCursor: null,
      hasMore: false,
    });
    usersRepo.findBlockedRelationshipIds.mockResolvedValue([]);
    repo.findLikesByUser.mockResolvedValue([]);
    repo.findRepostsByUser.mockResolvedValue([]);

    const result = await service.getFeed({}, {
      userId: 'viewer-b',
      username: 'b',
      role: 'USER',
    });

    expect(result.posts[0].liked).toBe(false);
    expect(repo.findLikesByUser).toHaveBeenCalledWith('viewer-b', ['p1']);
  });

  it('filters blocked authors on a cache hit', async () => {
    cache.get.mockResolvedValue({
      posts: [post('p1', 'blocked-user'), post('p2', 'ok-user')],
      nextCursor: null,
      hasMore: false,
    });
    usersRepo.findBlockedRelationshipIds.mockResolvedValue(['blocked-user']);
    repo.findLikesByUser.mockResolvedValue([]);
    repo.findRepostsByUser.mockResolvedValue([]);

    const result = await service.getFeed({}, {
      userId: 'viewer-a',
      username: 'a',
      role: 'USER',
    });

    expect(result.posts.map((p) => p.id)).toEqual(['p2']);
  });

  it('stores raw posts without liked metadata', async () => {
    cache.get.mockResolvedValue(null);
    repo.findFeed.mockResolvedValue([post('p1', 'author-1')]);
    usersRepo.findBlockedRelationshipIds.mockResolvedValue([]);
    repo.findLikesByUser.mockResolvedValue([{ postId: 'p1' }]);
    repo.findRepostsByUser.mockResolvedValue([]);

    await service.getFeed({}, {
      userId: 'viewer-a',
      username: 'a',
      role: 'USER',
    });

    expect(cache.set).toHaveBeenCalled();
    const stored = cache.set.mock.calls[0][1] as {
      posts: Array<{ liked?: boolean }>;
    };
    expect(stored.posts[0].liked).toBeUndefined();
  });

  it('hides a post from a viewer who blocked the author', async () => {
    repo.findById.mockResolvedValue(post('p1', 'blocked-user'));
    usersRepo.findBlockedRelationshipIds.mockResolvedValue(['blocked-user']);

    await expect(
      service.getPost('p1', {
        userId: 'viewer-a',
        username: 'a',
        role: 'USER',
      }),
    ).rejects.toMatchObject({ status: 403, error: 'blocked' });
  });
});
