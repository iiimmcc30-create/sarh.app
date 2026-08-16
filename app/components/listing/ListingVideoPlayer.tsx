import { Component, createElement, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { getExpoVideoModule, isExpoVideoNativeAvailable } from '@/lib/expoVideo';
import { resolveMediaUrl } from '@/services/media';

type Props = {
  uri: string;
  posterUri?: string | null;
  height?: number;
  aspectRatio?: number;
  style?: ViewStyle;
};

type NativePlayer = {
  loop: boolean;
  muted: boolean;
  status: string;
  keepScreenOnWhilePlaying: boolean;
  play: () => void;
  pause: () => void;
  addListener: (
    event: string,
    cb: (payload: { status?: string; isPlaying?: boolean }) => void,
  ) => { remove: () => void };
};

export function ListingVideoPlayer(props: Props) {
  return (
    <VideoErrorBoundary fallback={<VideoOpenFallback {...props} />}>
      <ListingVideoPlayerInner {...props} />
    </VideoErrorBoundary>
  );
}

function ListingVideoPlayerInner({
  uri,
  posterUri,
  height,
  aspectRatio = 16 / 9,
  style,
}: Props) {
  const videoUri = resolveMediaUrl(uri) ?? uri;
  const poster = resolveMediaUrl(posterUri) ?? posterUri ?? undefined;

  const containerStyle = useMemo(
    () => [styles.container, height ? { height, width: '100%' as const } : { aspectRatio }, style],
    [aspectRatio, height, style],
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

  return <VideoOpenFallback uri={videoUri} posterUri={poster} style={containerStyle} />;
}

function NativeListingVideo({
  uri,
  posterUri,
  containerStyle,
}: {
  uri: string;
  posterUri?: string;
  containerStyle: Array<ViewStyle | false | undefined>;
}) {
  const { useVideoPlayer, VideoView } = getExpoVideoModule()!;
  const [showPoster, setShowPoster] = useState(true);

  const player = useVideoPlayer({ uri }, (p) => {
    const native = p as NativePlayer;
    native.loop = false;
    native.muted = false;
    native.keepScreenOnWhilePlaying = false;
  }) as NativePlayer;

  const hidePoster = useCallback(() => setShowPoster(false), []);

  useEffect(() => {
    setShowPoster(true);
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay' || status === 'error') hidePoster();
    });
    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) hidePoster();
    });
    return () => {
      statusSub.remove();
      playingSub.remove();
      try {
        player.pause();
      } catch {
        /* ignore */
      }
    };
  }, [hidePoster, player, uri]);

  return (
    <View style={containerStyle}>
      {showPoster && posterUri ? (
        <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFillObject} contentFit="contain" />
      ) : null}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        useExoShutter={false}
        surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
        onFirstFrameRender={hidePoster}
      />
    </View>
  );
}

function VideoOpenFallback({
  uri,
  posterUri,
  height,
  aspectRatio = 16 / 9,
  style,
}: Props) {
  const videoUri = resolveMediaUrl(uri) ?? uri;
  const poster = resolveMediaUrl(posterUri) ?? posterUri ?? undefined;
  const containerStyle = [
    styles.container,
    height ? { height, width: '100%' as const } : { aspectRatio },
    style,
  ];

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

class VideoErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
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
