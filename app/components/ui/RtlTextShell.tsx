import { View, type ViewProps } from 'react-native';
import { getPhysicalLtrShellStyle } from '@/lib/rtl';

export type RtlTextShellProps = ViewProps & {
  /** Full-width block (default) vs flex row slot (`flex: 1`, `minWidth: 0`). */
  flex?: boolean;
};

/**
 * Physical LTR shell — isolates Arabic text bounds from parent RTL flex.
 * Pair with `RtlText` or styles from `getRtlBlockTextStyle()`.
 */
export function RtlTextShell({ flex = false, style, children, ...rest }: RtlTextShellProps) {
  return (
    <View style={[getPhysicalLtrShellStyle({ flex }), style]} {...rest}>
      {children}
    </View>
  );
}

export default RtlTextShell;
