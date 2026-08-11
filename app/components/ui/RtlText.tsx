import { StyleSheet, Text, View, type TextProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

type RtlTextProps = TextProps & {
  /** Override the outer LTR shell (e.g. flex: 1 in a row). */
  shellStyle?: StyleProp<ViewStyle>;
};

/**
 * Arabic text with the app’s LTR-shell pattern (same as SidebarMenuItem):
 * physical `direction: 'ltr'` wrapper so `textAlign: 'right'` stays on the visual right
 * under app-level RTL.
 */
export function RtlText({ style, shellStyle, ...props }: RtlTextProps) {
  return (
    <View style={[styles.shell, shellStyle]}>
      <Text {...props} style={[styles.text, style as StyleProp<TextStyle>]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    direction: 'ltr',
  },
  text: {
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

export default RtlText;
