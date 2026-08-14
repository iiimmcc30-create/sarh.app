import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { computeProductLineTotal, resolveLineWeightKg } from '@/lib/butcherOrderPricing';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import { resolveMediaUrl } from '@/services/media';
import {
  cutLabelAr,
  type ButcherProduct,
  type CutType,
} from '@/services/butcherData';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80';

type ButcherProductOptionsModalProps = {
  visible: boolean;
  product: ButcherProduct | null;
  currencySymbol: string;
  onClose: () => void;
  onAddToCart: (input: {
    product: ButcherProduct;
    cutType: CutType;
    weightRaw: string;
  }) => void;
};

export function ButcherProductOptionsModal({
  visible,
  product,
  currencySymbol,
  onClose,
  onAddToCart,
}: ButcherProductOptionsModalProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [selectedCut, setSelectedCut] = useState<CutType>('whole');
  const [weight, setWeight] = useState('1');

  useEffect(() => {
    if (!product) return;
    setSelectedCut(product.availableCuts[0] ?? 'whole');
    setWeight(String(product.weightRange?.min ?? 1));
  }, [product?.id]);

  const weightKg = product ? resolveLineWeightKg(weight, product) : 0;
  const lineTotal = product ? computeProductLineTotal(product, weightKg) : 0;

  const priceLabel = useMemo(() => {
    if (!product) return '';
    if (product.pricePerKg) {
      return `${lineTotal.toLocaleString('en-US')} ${currencySymbol}`;
    }
    return `${(product.priceFixed ?? 0).toLocaleString('en-US')} ${currencySymbol}`;
  }, [product, lineTotal, currencySymbol]);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart({ product, cutType: selectedCut, weightRaw: weight });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Image
              source={{ uri: resolveMediaUrl(product.images[0]) ?? PLACEHOLDER }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.heroText}>
              <Text style={styles.title}>{product.nameAr}</Text>
              {product.descriptionAr ? (
                <Text style={styles.subtitle}>{product.descriptionAr}</Text>
              ) : null}
            </View>
          </View>

          {product.availableCuts.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>طريقة التقطيع</Text>
              <View style={styles.chips}>
                {product.availableCuts.map((cut) => {
                  const active = selectedCut === cut;
                  return (
                    <Pressable
                      key={cut}
                      onPress={() => setSelectedCut(cut)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cutLabelAr(cut)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {product.pricePerKg ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الوزن (كغ)</Text>
              <View style={styles.weightRow}>
                <Pressable
                  style={styles.weightBtn}
                  onPress={() => setWeight(String(Math.max(0.5, weightKg - 0.5)))}
                >
                  <AppIcon name="remove" size={20} color={styles.iconColor.color} />
                </Pressable>
                <TextInput
                  style={styles.weightInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Pressable
                  style={styles.weightBtn}
                  onPress={() => setWeight(String(weightKg + 0.5))}
                >
                  <AppIcon name="add" size={20} color={styles.iconColor.color} />
                </Pressable>
              </View>
              {product.weightRange ? (
                <Text style={styles.hint}>
                  من {product.weightRange.min} إلى {product.weightRange.max} كغ
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{priceLabel}</Text>
          </View>
        </ScrollView>

        <Pressable
          onPress={handleAdd}
          disabled={lineTotal <= 0}
          style={({ pressed }) => [
            styles.cta,
            lineTotal <= 0 && styles.ctaDisabled,
            pressed && { opacity: 0.9 },
          ]}
        >
          <AppIcon name="cart-outline" size={15} color="#fff" />
          <Text style={styles.ctaText}>إضافة للسلة</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      maxHeight: '82%',
      backgroundColor: colors.bgDeep,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderSoft,
      marginBottom: spacing.md,
    },
    hero: {
      ...getRtlRow(),
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    image: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
    },
    heroText: { flex: 1, gap: 4 },
    title: {
      ...typography.h3,
      ...getRtlText(),
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      ...getRtlText(),
      color: colors.textMuted,
    },
    section: { marginBottom: spacing.lg, gap: spacing.sm },
    sectionTitle: {
      ...typography.bodyStrong,
      ...getRtlText(),
      color: colors.textPrimary,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgSurface,
    },
    chipActive: {
      borderColor: colors.electric,
      backgroundColor: colors.electric + '18',
    },
    chipText: {
      ...typography.caption,
      ...getRtlText(),
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    weightRow: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    weightBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
    },
    weightInput: {
      minWidth: 72,
      ...typography.h3,
      ...getRtlText(),
      color: colors.textPrimary,
      textAlign: 'center',
      paddingVertical: 4,
    },
    hint: {
      ...typography.micro,
      ...getRtlText(),
      color: colors.textMuted,
    },
    iconColor: { color: colors.textPrimary },
    totalRow: {
      ...getRtlRow(),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    totalLabel: {
      ...typography.bodyStrong,
      ...getRtlText(),
      color: colors.textSecondary,
    },
    totalValue: {
      ...typography.h3,
      ...getRtlText(),
      color: colors.textPrimary,
    },
    cta: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.electric,
      borderRadius: radius.pill,
      paddingVertical: 11,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.sm,
      alignSelf: 'center',
      minWidth: '55%',
    },
    ctaDisabled: { opacity: 0.5 },
    ctaText: {
      ...typography.caption,
      ...getRtlText(),
      color: '#fff',
      fontWeight: '600',
    },
  });
}
