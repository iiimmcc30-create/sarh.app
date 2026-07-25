import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/FlaticonIcon';

const BADGE_GREEN = '#0B5D3B';

type VerificationBadgeProps = {
  size?: number;
};

export function VerificationBadge({ size = 18 }: VerificationBadgeProps) {
  const iconSize = Math.round(size * 0.58);
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <AppIcon name="checkmark" size={iconSize} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: BADGE_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
