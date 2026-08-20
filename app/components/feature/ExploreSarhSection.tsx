import { AppIcon } from '@/components/ui/FlaticonIcon';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { motion, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { rtlForwardIcon } from '@/lib/rtl';
import type { HomeExploreCard } from '@/lib/homeExplore';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

type Props = {
  sections: HomeExploreCard[];
};

export function ExploreSarhSection({ sections }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const cardW = Math.min(320, Math.round(width * 0.72));

  if (sections.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader title="استكشف سرح" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={cardW + spacing.md}
        snapToAlignment="start"
      >
        {sections.map((item) => (
          <Pressable
            key={item.id ?? item.destination}
            accessibilityRole="button"
            accessibilityLabel={item.titleAr}
            onPress={() => safePush(item.route as never, undefined, router)}
            style={({ pressed }) => [
              styles.card,
              { width: cardW },
              pressed && styles.pressed,
            ]}
          >
            <CoverTrailRow justify="space-between" gap={spacing.md} style={styles.inner}>
              <AppIcon name={rtlForwardIcon()} size={16} color={styles.chevron.color} />
              <RtlTextShell flex>
                <RtlText style={styles.title} numberOfLines={1}>
                  {item.titleAr}
                </RtlText>
                <RtlText style={styles.desc} numberOfLines={2}>
                  {item.descriptionAr}
                </RtlText>
              </RtlTextShell>
              <View style={styles.iconHalo}>
                <View style={styles.iconRing}>
                  <View style={styles.iconInner}>
                    <AppIcon name={item.icon} size={22} color={styles.accent.color} />
                  </View>
                </View>
              </View>
            </CoverTrailRow>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingBottom: spacing.sm,
    },
    row: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.sm,
    },
    card: {
      borderRadius: 20,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      paddingVertical: 16,
      paddingHorizontal: 14,
      minHeight: 92,
      justifyContent: 'center',
    },
    inner: {
      alignItems: 'center',
    },
    title: {
      ...typography.cardHeading,
      color: colors.textPrimary,
    },
    desc: {
      ...typography.secondary,
      color: colors.textMuted,
      marginTop: 4,
    },
    iconHalo: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.electric + '33',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    iconRing: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.electric + '55',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconInner: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.electric + '1A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    accent: { color: colors.electricBright },
    chevron: { color: colors.textMuted },
    pressed: {
      transform: [{ scale: motion.pressScale }],
      opacity: 0.94,
    },
  });
}
