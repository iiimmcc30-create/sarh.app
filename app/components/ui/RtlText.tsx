import { AppText, type AppTextProps } from '@/components/ui/AppText';

export type RtlTextProps = AppTextProps;

/**
 * Same primitive as AppText. Kept so existing screens inherit the single RTL model.
 */
export function RtlText(props: RtlTextProps) {
  return <AppText {...props} />;
}

export default RtlText;
