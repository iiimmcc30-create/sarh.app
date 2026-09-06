import { AppText } from '@/components/ui/AppText';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import {
  OFFICIAL_SERVICE_CATEGORY_META,
  type OfficialService,
} from '@/services/officialServices';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  service: OfficialService;
  onPress: () => void;
};

export function MinistryServiceCard({ service, onPress }: Props) {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const meta = OFFICIAL_SERVICE_CATEGORY_META[service.category] ?? {
    label: service.category,
    emoji: '📋',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={service.title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <AppText style={styles.title} numberOfLines={2}>
        {service.title}
      </AppText>
      {service.description ? (
        <AppText style={styles.desc} numberOfLines={3}>
          {service.description}
        </AppText>
      ) : null}
      <View style={[styles.badge, getRtlRow()]}>
        <AppText style={styles.badgeEmoji}>{meta.emoji}</AppText>
        <AppText style={styles.badgeText}>{meta.label}</AppText>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      shadowColor: '#07131C',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 4,
    },
    title: {
      ...typography.smallHeading,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    desc: {
      ...typography.feedBody,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    badge: {
      alignSelf: 'flex-start',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(32, 182, 111, 0.14)',
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginTop: 4,
    },
    badgeEmoji: {
      fontSize: 12,
    },
    badgeText: {
      ...typography.caption,
      color: colors.electric,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.92,
    },
  });
}
