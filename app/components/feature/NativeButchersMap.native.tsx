import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ButcherProfile } from '@/services/butcherData';

export interface NativeButchersMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  butchers: ButcherProfile[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function NativeButchersMap({
  region,
  butchers,
  selectedId,
  onSelect,
}: NativeButchersMapProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));
  const [MapModule, setMapModule] = useState<typeof import('react-native-maps') | null>(null);

  useEffect(() => {
    let active = true;
    import('react-native-maps')
      .then((mod) => {
        if (active) setMapModule(mod);
      })
      .catch(() => {
        if (active) setMapModule(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!MapModule) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.electricBright} />
      </View>
    );
  }

  const { default: MapView, Marker } = MapModule;

  return (
    <MapView style={StyleSheet.absoluteFill} region={region}>
      {butchers.map((butcher) => (
        <Marker
          key={butcher.id}
          coordinate={{ latitude: butcher.lat, longitude: butcher.lng }}
          title={butcher.nameAr}
          description={butcher.cityAr}
          pinColor={butcher.subscriptionActive ? '#F59E0B' : '#3B82F6'}
          onPress={() => onSelect(selectedId === butcher.id ? null : butcher.id)}
        />
      ))}
    </MapView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loading: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
    },
  });
}
