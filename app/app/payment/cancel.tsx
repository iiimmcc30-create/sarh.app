import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { AppText, SarhButton } from '@/design-system/components';
import { Screen, ScreenBody, Stack } from '@/design-system/layout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { type ThemeColors } from '@/constants/theme';

function pickParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

/** Cancel URL from Network International when the shopper abandons checkout. */
export default function PaymentCancelScreen() {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));
  const router = useRouter();
  const params = useLocalSearchParams<{
    context?: string | string[];
    orderId?: string | string[];
  }>();
  const context = pickParam(params.context);
  const orderId = pickParam(params.orderId);
  const isButcherOrder = context === 'butcher_order' && Boolean(orderId);

  return (
    <Screen edges={['top', 'bottom']} pattern={false} style={styles.screen}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
      <ScreenBody scroll={false} padTop="xl" padBottom="xl">
        <Stack gap="md" align="center" fill style={styles.wrap}>
          <View style={styles.iconWrap}>
            <AppIcon name="close-circle" size={48} color={colors.rose} />
          </View>
          <AppText variant="heading2" align="center">لم يكتمل الدفع</AppText>
          <AppText variant="body" color="textSecondary" align="center">
            {isButcherOrder
              ? 'طلبك ما زال بانتظار الدفع. يمكنك إكمال الدفع من تفاصيل الطلب دون إنشاء طلب جديد.'
              : 'لم تُخصم أي مبالغ. يمكنك المحاولة مرة أخرى متى شئت.'}
          </AppText>
          <SarhButton
            title={isButcherOrder ? 'إكمال الدفع' : 'إعادة المحاولة'}
            fullWidth
            onPress={() => {
              if (isButcherOrder) {
                router.replace({
                  pathname: '/butchers/order/[id]',
                  params: { id: orderId },
                } as never);
                return;
              }
              router.replace('/subscription' as never);
            }}
          />
          <SarhButton
            title={isButcherOrder ? 'طلباتي' : 'العودة للملف'}
            variant="ghost"
            fullWidth
            onPress={() => {
              if (isButcherOrder) {
                router.replace('/butchers/my-orders' as never);
                return;
              }
              router.replace('/(tabs)/profile' as never);
            }}
          />
        </Stack>
      </ScreenBody>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    wrap: { justifyContent: 'center' },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.rose}22`,
    },
  });
}
