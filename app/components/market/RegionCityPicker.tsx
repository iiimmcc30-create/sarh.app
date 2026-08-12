import { AppIcon } from '@/components/ui/FlaticonIcon';
import type { RegionSelection, SaudiRegion } from '@/constants/saudiRegions';
import { ALL_REGIONS_LABEL, SAUDI_REGIONS } from '@/constants/saudiRegions';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { searchSaudiRegions } from '@/lib/saudiRegionSearch';
import { getRtlRow, rtlBackIcon } from '@/lib/rtl';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  selection: RegionSelection;
  onClose: () => void;
  onSelect: (selection: RegionSelection) => void;
};

export function RegionCityPicker({ visible, selection, onClose, onSelect }: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));
  const [query, setQuery] = useState('');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const hits = useMemo(() => searchSaudiRegions(query), [query]);

  const grouped = useMemo(() => {
    if (query.trim()) return null;
    return SAUDI_REGIONS;
  }, [query]);

  const pickAll = () => {
    onSelect({ type: 'all' });
    onClose();
  };

  const pickRegion = (region: SaudiRegion) => {
    onSelect({ type: 'region', region });
    onClose();
  };

  const pickCity = (region: SaudiRegion, city: (typeof region.cities)[0]) => {
    onSelect({ type: 'city', region, city });
    onClose();
  };

  const renderSearchResults = () => (
    <View style={styles.list}>
      {hits.length === 0 ? (
        <Text style={styles.empty}>لا توجد نتائج</Text>
      ) : (
        hits.map((hit) => {
          if (hit.kind === 'region') {
            return (
              <Pressable
                key={`r-${hit.region.id}`}
                style={styles.row}
                onPress={() => pickRegion(hit.region)}
              >
                <Text style={styles.rowTitle}>{hit.region.nameAr}</Text>
                <Text style={styles.rowSub}>كل مدن المنطقة</Text>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={`c-${hit.city.id}`}
              style={styles.row}
              onPress={() => pickCity(hit.region, hit.city)}
            >
              <Text style={styles.rowTitle}>{hit.city.nameAr}</Text>
              <Text style={styles.rowSub}>{hit.region.nameAr}</Text>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const renderGrouped = () => (
    <View style={styles.list}>
      {grouped?.map((region) => {
        const open = expandedRegion === region.id;
        return (
          <View key={region.id}>
            <Pressable
              style={[styles.row, getRtlRow()]}
              onPress={() => setExpandedRegion(open ? null : region.id)}
            >
              <View style={styles.rowTextShell}>
                <Text style={styles.rowTitle}>{region.nameAr}</Text>
                <Text style={styles.rowSub}>{region.cities.length} مدينة</Text>
              </View>
              <AppIcon name={open ? 'angle-up' : 'angle-down'} size={16} color={colors.textMuted} />
            </Pressable>
            {open ? (
              <View style={styles.cityList}>
                <Pressable style={styles.cityRow} onPress={() => pickRegion(region)}>
                  <Text style={styles.cityText}>كل {region.nameAr.replace(/^منطقة\s/, '')}</Text>
                </Pressable>
                {region.cities.map((city) => (
                  <Pressable
                    key={city.id}
                    style={styles.cityRow}
                    onPress={() => pickCity(region, city)}
                  >
                    <Text style={styles.cityText}>{city.nameAr}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={[styles.header, getRtlRow()]}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.backBtn}>
            <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>اختر المنطقة أو المدينة</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={[styles.searchWrap, getRtlRow()]}>
          <AppIcon name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن منطقة أو مدينة..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <AppIcon name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[styles.allRow, selection.type === 'all' && styles.allRowActive]}
          onPress={pickAll}
        >
          <Text style={[styles.allText, selection.type === 'all' && styles.allTextActive]}>
            {ALL_REGIONS_LABEL}
          </Text>
        </Pressable>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          {query.trim() ? renderSearchResults() : renderGrouped()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.screenRoot,
    },
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      writingDirection: 'rtl',
    },
    searchWrap: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      fontSize: 14,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    allRow: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
    },
    allRowActive: {
      backgroundColor: `${colors.electric}22`,
      borderWidth: 1,
      borderColor: colors.electric,
    },
    allText: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    allTextActive: {
      color: colors.electric,
    },
    scroll: {
      paddingBottom: spacing.xxxl,
    },
    list: {
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    row: {
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      marginBottom: spacing.xs,
      alignItems: 'center',
      gap: spacing.sm,
    },
    rowTextShell: {
      flex: 1,
      direction: 'ltr',
    },
    rowTitle: {
      ...typography.bodyStrong,
      fontSize: 14,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    rowSub: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    cityList: {
      marginBottom: spacing.sm,
      paddingStart: spacing.md,
      gap: 2,
    },
    cityRow: {
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
    },
    cityText: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    empty: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.xl,
      writingDirection: 'rtl',
    },
  });
}

export default RegionCityPicker;
