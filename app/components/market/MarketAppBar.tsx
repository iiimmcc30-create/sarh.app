import { HomeAppBar } from '@/components/ui/HomeAppBar';

type Props = {
  onMore: () => void;
  onSearch: () => void;
  searchPlaceholder?: string;
};

/** Market header shares the same iOS search chrome as home. */
export function MarketAppBar({
  onMore,
  onSearch,
  searchPlaceholder = 'ابحث في السوق',
}: Props) {
  return (
    <HomeAppBar
      onMore={onMore}
      onSearch={onSearch}
      searchPlaceholder={searchPlaceholder}
    />
  );
}

export default MarketAppBar;
