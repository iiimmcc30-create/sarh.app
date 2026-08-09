import { AppIcon } from '@/components/ui/FlaticonIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ambientShadow } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText, getRtlRow } from '@/lib/rtl';
import type { OfficialService } from '@/services/officialServices';
import { Linking, StyleSheet, Text, View } from 'react-native';

type OfficialServiceCardProps = {
  service: OfficialService;
};

export function OfficialServiceCard({ service }: OfficialServiceCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));

  const openService = async () => {
    const url = service.externalUrl?.trim();
    if (!url) return;
    await Linking.openURL(url);
  };

  return (
    <View style={styles.card}>
      <View style={[styles.header, getRtlRow()]}>
        <View style={styles.iconWrap}>
          <AppIcon name={service.icon || 'link-outline'} size={22} color={colors.textMuted} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{service.title}</Text>
      </View>

      <Text style={styles.description}>{service.description}</Text>

      <PrimaryButton
        title="🔗 طلب الخدمة"
        icon="open-outline"
        onPress={() => void openService()}
        small
        fullWidth
      />
    </View>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  return StyleSheet.create({
    card: {
      borderRadius: sarh.radius.card,
      padding: spacing.lg,
      gap: spacing.md,
      backgroundColor: scheme === 'dark' ? sarh.color.surface : colors.bgGlassStrong,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: scheme === 'dark' ? sarh.color.border : colors.borderSoft,
      ...ambientShadow(scheme, 'soft'),
    },
    header: {
      alignItems: 'center',
      gap: spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgGlass,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderMid,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      flex: 1,
      ...getRtlText(),
      ...getRtlText(),
      lineHeight: 24,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      ...getRtlText(),
      ...getRtlText(),
      lineHeight: 22,
    },
  });
}
