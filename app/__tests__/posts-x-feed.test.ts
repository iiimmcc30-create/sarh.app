import { readFileSync } from 'fs';
import path from 'path';
import { formatPostCardTimestampAr, formatViewsLabelAr } from '@/lib/formatRelativeTime';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

function hoursAgo(h: number, now = Date.now()) {
  return new Date(now - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number, now = Date.now()) {
  return new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
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
    expect(postItem).toContain('formatPostCardTimestampAr');
    expect(postItem).toContain("from '@/components/ui/AppText'");
    expect(postItem).toContain('formatCount(post.views ?? 0)');
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
    expect(detail).not.toContain('formatPostCardTimestampAr');
  });

  it('formats real view counts in Arabic', () => {
    expect(formatViewsLabelAr(1)).toContain('مشاهدة');
    expect(formatViewsLabelAr(831)).toContain('مشاهدات');
    expect(formatViewsLabelAr(831)).toContain('٨٣١');
  });

  it('formats external post card relative time', () => {
    const now = Date.parse('2026-09-05T12:00:00.000Z');
    expect(formatPostCardTimestampAr(hoursAgo(5, now), now)).toBe('5س');
    expect(formatPostCardTimestampAr(hoursAgo(17, now), now)).toBe('17س');
    expect(formatPostCardTimestampAr(hoursAgo(23, now), now)).toBe('23س');
    expect(formatPostCardTimestampAr(hoursAgo(24, now), now)).toBe('1يوم');
    expect(formatPostCardTimestampAr(daysAgo(3, now), now)).toBe('3يوم');
    expect(formatPostCardTimestampAr(daysAgo(7, now), now)).toBe('7يوم');
    expect(formatPostCardTimestampAr(daysAgo(8, now), now)).toMatch(/^\d+\s+\S+$/);
    expect(formatPostCardTimestampAr(daysAgo(30, now), now)).toMatch(/^\d+\s+\S+$/);
  });
});
