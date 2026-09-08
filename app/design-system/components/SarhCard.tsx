import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { resolveSarhCardStyle, type SarhCardPadding, type SarhCardVariant } from './resolvers';

export type SarhCardProps = {
  children?: ReactNode;
  variant?: SarhCardVariant;
  padding?: SarhCardPadding;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export { CARD_PADDING, resolveSarhCardStyle } from './resolvers';
export type { SarhCardPadding, SarhCardVariant } from './resolvers';

export function SarhCard({
  children,
  variant = 'default',
  padding = 'md',
  style,
  testID,
}: SarhCardProps) {
  return (
    <View testID={testID} style={[resolveSarhCardStyle(variant, padding), style]}>
      {children}
    </View>
  );
}

export default SarhCard;
