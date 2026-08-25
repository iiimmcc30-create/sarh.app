import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { AppLogo } from '@/components/ui/AppLogo';
import { useAuthCopy } from '@/hooks/useAuthCopy';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlText } from '@/lib/rtl';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { copy } = useAuthCopy();
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgDeep, colors.bgPrimary, colors.bgDeep]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[`${colors.electric}18`, 'transparent']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <View style={styles.hero}>
            <AppLogo size={96} showRing={false} shape="square" />
            <Text style={styles.brand}>{copy.brandName}</Text>
            <Text style={styles.title}>{copy.welcomeTitle}</Text>
            <Text style={styles.subtitle}>{copy.welcomeSubtitle}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={() => router.push('/auth/register')}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>{copy.startCta}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => router.push('/auth/phone')}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{copy.haveAccount}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgDeep },
    glow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 280,
    },
    safe: { flex: 1 },
    body: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      justifyContent: 'space-between',
      paddingBottom: spacing.xl,
    },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingTop: spacing.xxl,
    },
    brand: {
      ...typography.display,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      ...getRtlText(),
      marginTop: spacing.sm,
    },
    title: {
      ...typography.sectionHeading,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'center',
      ...getRtlText(),
    },
    subtitle: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 300,
      ...getRtlText(),
    },
    actions: { gap: spacing.md },
    primaryBtn: {
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.electric,
    },
    primaryText: {
      ...typography.button,
      fontFamily: OFFICIAL_APP_FONT,
      color: '#fff',
    },
    secondaryBtn: {
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderMid,
      backgroundColor: 'transparent',
    },
    secondaryText: {
      ...typography.button,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    pressed: { opacity: 0.88 },
  });
}
