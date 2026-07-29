import React, { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import {
  DEFAULT_ICON_SIZE,
  ICON_STROKE,
  resolveLucideIcon,
} from '@/lib/lucideIconMap';

export type FlaticonIconProps = {
  /** Icon name (legacy aliases supported) */
  name: string;
  /** Ignored — Lucide stroke icons only */
  variant?: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

function FlaticonIconComponent({
  name,
  size = DEFAULT_ICON_SIZE,
  color,
  style,
}: FlaticonIconProps) {
  const Icon = resolveLucideIcon(name);
  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={ICON_STROKE}
      style={style}
    />
  );
}

export const FlaticonIcon = memo(FlaticonIconComponent);
export const AppIcon = FlaticonIcon;
