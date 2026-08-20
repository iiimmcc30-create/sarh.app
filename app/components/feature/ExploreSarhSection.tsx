import { AppIcon } from '@/components/ui/FlaticonIcon';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { motion, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { HomeExploreCard } from '@/lib/homeExplore';
import { getRtlRow } from '@/lib/rtl';
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
  const cardW = Math.min(220, Math.round(width * 0.52));
  const step = cardW + spacing.md;

  if (sections.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader title="استكشف سرح" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={[styles.row, getRtlRow()]}
        decelerationRate="fast"
        snapToInterval={step}
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
            <View style={styles.iconRing}>
              <AppIcon name={item.icon} size={20} color={styles.accent.color} />
            </View>
            <View style={styles.copy}>
              <RtlTextShell>
                <RtlText style={styles.title} numberOfLines={1}>
                  {item.titleAr}
                </RtlText>
                <RtlText style={styles.desc} numberOfLines={2}>
                  {item.descriptionAr}
                </RtlText>
              </RtlTextShell>
            </View>
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
    scroller: {
      flexGrow: 0,
    },
    row: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.sm,
    },
    card: {
      minHeight: 118,
      borderRadius: 18,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      paddingTop: 14,
      paddingBottom: 14,
      paddingHorizontal: 14,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      direction: 'ltr',
    },
    copy: {
      width: '100%',
      alignItems: 'flex-end',
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
    iconRing: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1.25,
      borderColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      flexShrink: 0,
    },
    accent: { color: colors.electric },
    pressed: {
      transform: [{ scale: motion.pressScale }],
      opacity: 0.94,
    },
  });
}
