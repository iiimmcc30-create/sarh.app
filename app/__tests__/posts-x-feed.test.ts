import { readFileSync } from 'fs';
import path from 'path';
import { formatViewsLabelAr } from '@/lib/formatRelativeTime';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

describe('Posts feed — X-style structure', () => {
  const postItem = src('components/feature/PostItem.tsx');
  const comments = src('components/feature/PostCommentsSection.tsx');
  const detail = src('app/post/[id].tsx');

  it('PostItem is a full-width row without floating cards', () => {
    expect(postItem).toContain('borderBottomWidth: StyleSheet.hairlineWidth');
    expect(postItem).not.toContain('MENU_CARD');
    expect(postItem).not.toContain('borderRadius: MENU_CARD');
    expect(postItem).not.toContain("textAlign: 'right'");
    expect(postItem).not.toContain("direction: 'ltr'");
    expect(postItem).not.toContain('row-reverse');
    expect(postItem).not.toContain('RtlTextShell');
    expect(postItem).toContain('ellipsis-vertical');
    expect(postItem).toContain('formatViewsLabelAr');
    expect(postItem).toContain("from '@/components/ui/AppText'");
  });

  it('comments are a continuation of the post feed without a section title', () => {
    expect(comments).not.toContain('styles.title');
    expect(comments).not.toContain('CoverTrailRow');
    expect(comments).not.toContain('commentBubble');
    expect(comments).not.toContain('RtlTextShell');
    expect(comments).not.toContain("textAlign: 'right'");
    expect(comments).toContain('ellipsis-vertical');
    expect(comments).toContain('اكتب تعليقاً');
    expect(comments).toContain('PostCommentsComposer');
    expect(comments).toContain('deletePostComment');
  });

  it('detail screen keeps post + replies in one feed with a sticky composer', () => {
    expect(detail).toContain('PostCommentsProvider');
    expect(detail).toContain('PostCommentsList');
    expect(detail).toContain('PostCommentsComposer');
    expect(detail).toContain('addComment');
    expect(detail).toContain('toggleLike');
    expect(detail).toContain('showPostMenu');
  });

  it('profile posts tab uses the same flush feed as the posts tab', () => {
    const profile = src('components/feature/ProfileScreenLayout.tsx');
    expect(profile).toContain('postsFeedFlush');
    expect(profile).toContain("activeTab === 'posts' ? styles.postsFeedFlush");
  });

  it('formats real view counts in Arabic', () => {
    expect(formatViewsLabelAr(1)).toContain('مشاهدة');
    expect(formatViewsLabelAr(831)).toContain('مشاهدات');
    expect(formatViewsLabelAr(831)).toContain('٨٣١');
  });
});
