import type { StyleProp, ViewStyle } from 'react-native';
import { SarhButton, type SarhButtonVariant } from '@/design-system/components';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'ghost' | 'gold' | 'outline';
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

function mapVariant(variant: NonNullable<PrimaryButtonProps['variant']>): SarhButtonVariant {
  if (variant === 'ghost' || variant === 'outline') return 'secondary';
  return 'primary';
}

/** Legacy button entry — visual + tokens now come from `SarhButton`. */
export function PrimaryButton({
  title,
  onPress,
  style,
  variant = 'primary',
  small,
  disabled,
  loading = false,
  icon,
  fullWidth = false,
}: PrimaryButtonProps) {
  return (
    <SarhButton
      title={title}
      onPress={onPress}
      variant={mapVariant(variant)}
      size={small ? 'sm' : 'md'}
      disabled={disabled}
      loading={loading}
      leftIcon={icon}
      fullWidth={fullWidth}
      style={style}
    />
  );
}

export default PrimaryButton;
