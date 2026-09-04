import { View, type ViewProps } from 'react-native';
import { getPhysicalLtrShellStyle } from '@/lib/rtl';

export type RtlTextShellProps = ViewProps & {
  /** Full-width block (default) vs flex row slot (`flex: 1`, `minWidth: 0`). */
  flex?: boolean;
};

/**
 * @deprecated Dual-system LTR island. New UI: wrap nothing — use `AppText`.
 */
export function RtlTextShell({ flex = false, style, children, ...rest }: RtlTextShellProps) {
  return (
    <View style={[getPhysicalLtrShellStyle({ flex }), style]} {...rest}>
      {children}
    </View>
  );
}

export default RtlTextShell;
