import { View, type ViewProps, type ViewStyle } from 'react-native';
import { getCoverTrailRowStyle } from '@/lib/rtl';

export type CoverTrailRowProps = ViewProps & {
  /** When true the row itself grows inside a parent flex layout. */
  flex?: boolean;
  justify?: ViewStyle['justifyContent'];
  gap?: number;
};

/**
 * Mixed-element row in physical LTR order — text shell + icon/image/button.
 * Unaffected by global RTL flex reversal.
 */
export function CoverTrailRow({
  flex,
  justify,
  gap,
  style,
  children,
  ...rest
}: CoverTrailRowProps) {
  return (
    <View
      style={[getCoverTrailRowStyle({ flex, justifyContent: justify, gap }), style]}
      {...rest}
    >
      {children}
    </View>
  );
}

export default CoverTrailRow;
