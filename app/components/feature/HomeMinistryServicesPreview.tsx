import { AppIcon } from '@/components/ui/FlaticonIcon';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import {
  previewOfficialServices,
  type OfficialService,
} from '@/services/officialServices';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

type Props = {
  services: OfficialService[];
  loading?: boolean;
};

export function HomeMinistryServicesPreview({ services, loading }: Props) {
  const router = useRouter();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const preview = previewOfficialServices(services);

  if (!loading && preview.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="خدمات الوزارة"
        onSeeAll={() => safePush('/sarh-services', undefined, router)}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, getRtlRow()]}
      >
        {loading && preview.length === 0
          ? [0, 1, 2].map((i) => <View key={`sk-${i}`} style={[styles.tile, styles.skeleton]} />)
          : preview.map((service) => (
              <Pressable
                key={service.id}
                accessibilityRole="button"
                accessibilityLabel={service.title}
                onPress={() => {
                  const url = service.externalUrl?.trim();
                  if (url) void Linking.openURL(url);
                }}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <View style={[styles.tileInner, getRtlRow()]}>
                  <AppIcon
                    name={service.icon || 'briefcase-outline'}
                    size={20}
                    color={styles.icon.color}
                  />
                  <AppText style={styles.tileTitle} numberOfLines={2}>
                    {service.title}
                  </AppText>
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
    row: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    tile: {
      minWidth: 148,
      maxWidth: 180,
      minHeight: 72,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bgSurface,
      justifyContent: 'center',
    },
    tileInner: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    tileTitle: {
      ...typography.feedBody,
      color: colors.textPrimary,
      flex: 1,
    },
    icon: { color: colors.electric },
    skeleton: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.86,
    },
  });
}

export default HomeMinistryServicesPreview;
