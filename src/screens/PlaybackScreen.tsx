import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Playback'>;
  route: RouteProp<RootStackParamList, 'Playback'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * 9 / 16);

// YouTube embed error codes
const EMBED_BLOCKED_CODES = [101, 150]; // video not allowed to be embedded

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function PlaybackScreen({ navigation, route }: Props) {
  const { config } = route.params;
  const { video, segments } = config;

  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const playerRef = useRef<any>(null);
  const segmentCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const seg = segments[currentSegmentIndex];

  useFocusEffect(
    useCallback(() => {
      startSegmentWatcher();
      return () => stopSegmentWatcher();
    }, [currentSegmentIndex, segments]),
  );

  const startSegmentWatcher = () => {
    stopSegmentWatcher();
    segmentCheckRef.current = setInterval(async () => {
      if (!playerRef.current) return;
      try {
        const currentTime: number = await playerRef.current.getCurrentTime();
        const s = segments[currentSegmentIndex];
        if (currentTime >= s.endSeconds - 0.5) {
          stopSegmentWatcher();
          handleSegmentEnd();
        }
      } catch {
        // player not ready yet
      }
    }, 500);
  };

  const stopSegmentWatcher = () => {
    if (segmentCheckRef.current) {
      clearInterval(segmentCheckRef.current);
      segmentCheckRef.current = null;
    }
  };

  const handleSegmentEnd = () => {
    const nextIndex = currentSegmentIndex + 1;
    if (nextIndex < segments.length) {
      playerRef.current?.seekTo(segments[nextIndex].startSeconds, true);
      setCurrentSegmentIndex(nextIndex);
      setIsPlaying(true);
    } else {
      navigation.replace('Finished');
    }
  };

  const handleExit = () => {
    stopSegmentWatcher();
    navigation.reset({ index: 0, routes: [{ name: 'LockedHome' }] });
  };

  const onPlayerReady = () => {
    setPlayerReady(true);
    setIsPlaying(true);
  };

  const onPlayerStateChange = (state: string) => {
    if (state === 'ended') {
      stopSegmentWatcher();
      handleSegmentEnd();
    }
  };

  const onPlayerError = (error: string) => {
    const code = Number(error);
    if (EMBED_BLOCKED_CODES.includes(code)) {
      setEmbedBlocked(true);
    }
  };

  if (embedBlocked) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar hidden />
        <SafeAreaView style={styles.errorSafe}>
          <Text style={styles.errorEmoji}>🚫</Text>
          <Text style={styles.errorTitle}>Video niet beschikbaar</Text>
          <Text style={styles.errorBody}>
            Deze video mag niet buiten YouTube worden afgespeeld.{'\n'}
            Kies een andere video.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleExit}>
            <Text style={styles.errorButtonText}>← Terug naar home</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Top safe area + exit button */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit} activeOpacity={0.7}>
          <Text style={styles.exitIcon}>✕</Text>
        </TouchableOpacity>
        {segments.length > 1 && (
          <View style={styles.segmentBadge}>
            <Text style={styles.segmentText}>
              Deel {currentSegmentIndex + 1}/{segments.length}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Video — centered vertically in remaining space */}
      <View style={styles.videoWrapper}>
        <View style={styles.videoContainer}>
          <YoutubePlayer
            ref={playerRef}
            height={VIDEO_HEIGHT}
            width={SCREEN_WIDTH}
            videoId={video.id}
            play={isPlaying}
            onReady={onPlayerReady}
            onChangeState={onPlayerStateChange}
            onError={onPlayerError}
            initialPlayerParams={{
              start: seg.startSeconds,
              controls: false,
              rel: false,
              modestbranding: true,
              iv_load_policy: 3,
              fs: false,
              loop: false,
            }}
            webViewStyle={styles.webView}
            webViewProps={{
              allowsFullscreenVideo: false,
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
              scrollEnabled: false,
              bounces: false,
            }}
          />
          {/* Overlay blocks all YouTube UI touches */}
          <View
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          />
          {/* Loading indicator before player is ready */}
          {!playerReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <SafeAreaView style={styles.controls}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {decodeHtml(video.title)}
        </Text>

        <TouchableOpacity
          style={styles.playPauseBtn}
          onPress={() => setIsPlaying(p => !p)}
          activeOpacity={0.85}>
          <Text style={styles.playPauseIcon}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // Top bar with exit button
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  segmentBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentText: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },

  // Video
  videoWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  webView: {
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },

  // Controls below video
  controls: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    paddingTop: 8,
    alignItems: 'center',
    gap: 20,
  },
  videoTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },
  playPauseBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  playPauseIcon: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 36,
  },

  // Error screen
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  errorSafe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorEmoji: { fontSize: 56 },
  errorTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
});
