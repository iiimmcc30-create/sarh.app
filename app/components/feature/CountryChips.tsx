// Powered by OnSpace.AI
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
import { Country, countries } from '@/services/types';

interface CountryChipsProps {
  value: Country | 'ALL';
  onChange: (c: Country | 'ALL') => void;
}

const order: (Country | 'ALL')[] = ['ALL', 'SA'];

export function CountryChips({ value, onChange }: CountryChipsProps) {
  return (
    <View style={styles.wrap}>
      <FilterChipRow contentPaddingHorizontal={spacing.lg}>
        {order.map((code) => {
          const label = code === 'ALL' ? 'الكل' : countries[code as Country].ar;
          return (
            <FilterChip
              key={code}
              label={label}
              selected={value === code}
              onPress={() => onChange(code)}
            />
          );
        })}
      </FilterChipRow>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 50,
    paddingVertical: spacing.sm,
  },
});

export default CountryChips;
