import { View, type ViewProps } from 'react-native';

export type RtlTextShellProps = ViewProps & {
  /** Full-width block (default) vs flex row slot (`flex: 1`, `minWidth: 0`). */
  flex?: boolean;
};

/**
 * Layout bounds only — no LTR island. Existing wrappers stay, without dual RTL.
 */
export function RtlTextShell({ flex = false, style, children, ...rest }: RtlTextShellProps) {
  return (
    <View style={[flex ? { flex: 1, minWidth: 0 } : { width: '100%' }, style]} {...rest}>
      {children}
    </View>
  );
}

export default RtlTextShell;
