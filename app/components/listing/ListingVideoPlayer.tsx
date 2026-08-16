import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { getExpoVideoModule } from '@/lib/expoVideo';
import { resolveMediaUrl } from '@/services/media';

type Props = {
  uri: string;
  posterUri?: string | null;
  aspectRatio?: number;
  style?: ViewStyle;
};

export function ListingVideoPlayer({
  uri,
  posterUri,
  aspectRatio = 16 / 9,
  style,
}: Props) {
  const videoUri = resolveMediaUrl(uri) ?? uri;
  const poster = resolveMediaUrl(posterUri) ?? posterUri ?? undefined;
  const [playing, setPlaying] = useState(false);
  const [nativeAvailable] = useState(() => getExpoVideoModule() != null);

  const containerStyle = useMemo(
    () => [styles.container, { aspectRatio }, style],
    [aspectRatio, style],
  );

  if (!nativeAvailable || Platform.OS === 'web' || !playing) {
    return (
      <View style={containerStyle}>
        {poster ? (
          <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : null}
        <Pressable
          style={styles.playBtn}
          onPress={() => setPlaying(true)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="تشغيل فيديو الإعلان"
        >
          <View style={styles.playBtnCircle}>
            <AppIcon name="play" size={24} color="#fff" />
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <NativeListingVideo
      uri={videoUri}
      containerStyle={containerStyle}
      onClose={() => setPlaying(false)}
    />
  );
}

function NativeListingVideo({
  uri,
  containerStyle,
  onClose,
}: {
  uri: string;
  containerStyle: ViewStyle[];
  onClose: () => void;
}) {
  const mod = getExpoVideoModule()!;
  const { useVideoPlayer, VideoView } = mod;

  const player = useVideoPlayer(uri, (p: { loop: boolean; muted: boolean; play: () => void }) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    return () => {
      try {
        (playerRef.current as { pause?: () => void })?.pause?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <View style={containerStyle}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
      />
      <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8} accessibilityLabel="إيقاف الفيديو">
        <AppIcon name="close-circle" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playBtn: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
