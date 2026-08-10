import { Image } from '@/components/ui/AppImage';
import { StyleSheet, View } from 'react-native';
import { osmStaticMapUrl } from '@/lib/osmMap';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  lat: number;
  lng: number;
  height: number;
};

/** Native / fallback — OSM static map image */
export function OsmMapView({ lat, lng, height }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { height, backgroundColor: colors.bgElevated }]}>
      <Image
        source={{ uri: osmStaticMapUrl(lat, lng, 640, Math.round(height * 2)) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
  },
});
