import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { RtlText } from '@/components/ui/RtlText';

export type VerifiedInlineNameProps = {
  name: string;
  verified?: boolean;
  badgeSize?: number;
  nameStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Arabic display name + verification badge — physical LTR row-reverse cluster.
 * Badge sits one space (gap 4) to the left of the name; pair aligns to the inline end
 * when wrapped in a parent with `direction: 'ltr'` (see ProfileScreenLayout nameBlock).
 */
export function VerifiedInlineName({
  name,
  verified = false,
  badgeSize = 14,
  nameStyle,
  numberOfLines = 1,
  style,
}: VerifiedInlineNameProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.nameShell}>
        <RtlText style={[styles.nameInline, nameStyle]} numberOfLines={numberOfLines}>
          {name}
        </RtlText>
      </View>
      {verified ? <VerificationBadge size={badgeSize} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    direction: 'ltr',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 4,
    flexShrink: 1,
    maxWidth: '100%',
  },
  nameShell: {
    direction: 'ltr',
    flexShrink: 1,
    minWidth: 0,
  },
  nameInline: {
    width: 'auto',
    flexShrink: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

export default VerifiedInlineName;
