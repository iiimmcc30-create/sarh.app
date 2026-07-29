import { SectionHeader } from '@/components/ui/SectionHeader';

type HomeSectionHeaderProps = {
  title: string;
  onSeeAll?: () => void;
};

/** @deprecated Use SectionHeader — kept for existing imports. */
export function HomeSectionHeader({ title, onSeeAll }: HomeSectionHeaderProps) {
  return <SectionHeader title={title} onSeeAll={onSeeAll} />;
}
