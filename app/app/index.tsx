import { ActivityIndicator, View } from 'react-native';

/** Root index waits for boot; AuthGuard is the single navigation decision source. */
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#07131C' }}>
      <ActivityIndicator size="large" color="#20B66F" />
    </View>
  );
}
