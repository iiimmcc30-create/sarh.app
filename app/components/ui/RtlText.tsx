import { Text, type TextProps } from 'react-native';
import { getRtlBlockTextStyle } from '@/lib/rtl';

export type RtlTextProps = TextProps;

/**
 * Block Arabic text — `width: '100%'`, `textAlign: 'right'`, `writingDirection: 'rtl'`.
 * Use inside `RtlTextShell` (or any view that already defines text bounds).
 */
export function RtlText({ style, ...rest }: RtlTextProps) {
  return <Text style={[getRtlBlockTextStyle(), style]} {...rest} />;
}

/** Alias for design-system naming consistency. */
export const AppText = RtlText;

export default RtlText;
