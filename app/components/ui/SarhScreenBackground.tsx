import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';
import { sarh } from '@/constants/sarhTokens';
import { useTheme } from '@/hooks/useTheme';

/**
 * Sarh premium screen backdrop — background layer only.
 *
 * Paints an opaque dark base (colors.bgDeep) so tab screens never leak the
 * page base, then layers a very subtle depth gradient plus logo-inspired
 * curves in dark mode. Content and existing components render on top
 * untouched. In light mode it stays a flat surface to match the current look.
 */
export type SarhBackgroundVariant = 'home' | 'market' | 'posts' | 'profile';

type SarhScreenBackgroundProps = {
  children: ReactNode;
  variant?: SarhBackgroundVariant;
  style?: StyleProp<ViewStyle>;
};

type Blob = { cx: number; cy: number; rx: number; ry: number; opacity: number };

type VariantConfig = {
  curveShift: number;
  curveOpacity: number;
  glow: Blob;
  accent: Blob;
};

// Subtle per-screen differences so the four tabs feel like one system
// without looking identical. Opacities stay within the 0.04–0.08 range.
// Coordinates are in the 400 x 800 viewBox space.
const VARIANTS: Record<SarhBackgroundVariant, VariantConfig> = {
  home: {
    curveShift: 0,
    curveOpacity: 0.07,
    glow: { cx: 330, cy: 90, rx: 250, ry: 260, opacity: 0.08 },
    accent: { cx: 50, cy: 690, rx: 200, ry: 230, opacity: 0.05 },
  },
  market: {
    curveShift: -60,
    curveOpacity: 0.06,
    glow: { cx: 70, cy: 70, rx: 240, ry: 250, opacity: 0.07 },
    accent: { cx: 350, cy: 660, rx: 190, ry: 230, opacity: 0.05 },
  },
  posts: {
    curveShift: 40,
    curveOpacity: 0.05,
    glow: { cx: 320, cy: 110, rx: 230, ry: 240, opacity: 0.06 },
    accent: { cx: 64, cy: 640, rx: 180, ry: 220, opacity: 0.04 },
  },
  profile: {
    curveShift: -20,
    curveOpacity: 0.07,
    glow: { cx: 200, cy: 40, rx: 320, ry: 240, opacity: 0.08 },
    accent: { cx: 336, cy: 620, rx: 190, ry: 230, opacity: 0.05 },
  },
};

export function SarhScreenBackground({
  children,
  variant = 'home',
  style,
}: SarhScreenBackgroundProps) {
  const { colors, isDark } = useTheme();
  const cfg = VARIANTS[variant];

  return (
    <View style={[styles.root, { backgroundColor: colors.bgDeep }, style]}>
      {isDark ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            <LinearGradient id="sarhDepth" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={sarh.color.bg} stopOpacity={0} />
              <Stop offset="0.55" stopColor={sarh.color.surface} stopOpacity={0.35} />
              <Stop offset="1" stopColor={sarh.color.surfaceRaised} stopOpacity={0.6} />
            </LinearGradient>
            <RadialGradient id="sarhGlow" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={sarh.color.pattern} stopOpacity={cfg.glow.opacity} />
              <Stop offset="1" stopColor={sarh.color.pattern} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="sarhAccent" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={sarh.color.action} stopOpacity={cfg.accent.opacity} />
              <Stop offset="1" stopColor={sarh.color.action} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* Gentle vertical depth */}
          <Rect x="0" y="0" width="400" height="800" fill="url(#sarhDepth)" />

          {/* Soft radial depth blobs (muted surface + very faint brand) */}
          <Ellipse cx={cfg.glow.cx} cy={cfg.glow.cy} rx={cfg.glow.rx} ry={cfg.glow.ry} fill="url(#sarhGlow)" />
          <Ellipse cx={cfg.accent.cx} cy={cfg.accent.cy} rx={cfg.accent.rx} ry={cfg.accent.ry} fill="url(#sarhAccent)" />

          {/* Logo-inspired flowing curves — subtle, never above content */}
          <G transform={`translate(0, ${cfg.curveShift})`}>
            <Path
              d="M-30 150 Q 120 60, 250 130 T 440 100"
              stroke={sarh.color.pattern}
              strokeWidth={1.3}
              fill="none"
              strokeOpacity={cfg.curveOpacity}
            />
            <Path
              d="M-40 300 Q 110 210, 240 280 T 440 240"
              stroke={sarh.color.pattern}
              strokeWidth={1.1}
              fill="none"
              strokeOpacity={cfg.curveOpacity * 0.85}
            />
            <Path
              d="M0 470 Q 150 380, 290 450 T 430 420"
              stroke={sarh.color.pattern}
              strokeWidth={1.4}
              fill="none"
              strokeOpacity={cfg.curveOpacity * 0.7}
            />
            <Path
              d="M-30 640 Q 160 550, 300 620 T 440 590"
              stroke={sarh.color.pattern}
              strokeWidth={1}
              fill="none"
              strokeOpacity={cfg.curveOpacity * 0.55}
            />
            <Path
              d="M90 -20 Q 210 130, 120 260 T 200 430 T 110 610 T 190 820"
              stroke={sarh.color.pattern}
              strokeWidth={0.9}
              fill="none"
              strokeOpacity={cfg.curveOpacity * 0.5}
            />
          </G>
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default SarhScreenBackground;
