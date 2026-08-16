import { createElement, useEffect, useMemo, useRef } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { getExpoVideoModule, isExpoVideoNativeAvailable } from '@/lib/expoVideo';
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

  const containerStyle = useMemo(
    () => [styles.container, { aspectRatio }, style],
    [aspectRatio, style],
  );

  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        {createElement('video', {
          src: videoUri,
          poster,
          controls: true,
          playsInline: true,
          preload: 'metadata',
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000',
          },
        })}
      </View>
    );
  }

  if (isExpoVideoNativeAvailable()) {
    return <NativeListingVideo uri={videoUri} posterUri={poster} containerStyle={containerStyle} />;
  }

  return (
    <View style={containerStyle}>
      {poster ? (
        <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="contain" />
      ) : null}
      <Pressable
        style={styles.playBtn}
        onPress={() => void Linking.openURL(videoUri)}
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

function NativeListingVideo({
  uri,
  posterUri,
  containerStyle,
}: {
  uri: string;
  posterUri?: string;
  containerStyle: ViewStyle[];
}) {
  const mod = getExpoVideoModule()!;
  const { useVideoPlayer, VideoView } = mod;

  const player = useVideoPlayer(uri, (p: { loop: boolean; muted: boolean }) => {
    p.loop = false;
    p.muted = false;
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
      {posterUri ? (
        <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} contentFit="contain" />
      ) : null}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
        playsInline
      />
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
});
