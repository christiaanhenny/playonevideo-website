import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  SafeAreaView,
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

export function PlaybackScreen({ navigation, route }: Props) {
  const { config } = route.params;
  const { video, segments } = config;

  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
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
      // useFocusEffect restarts the watcher when currentSegmentIndex state updates
    } else {
      navigation.replace('Finished');
    }
  };

  const onPlayerReady = () => {
    setPlayerReady(true);
    setIsPlaying(true);
    setHasStartedPlaying(true);
  };

  const onPlayerStateChange = (state: string) => {
    if (state === 'playing') setHasStartedPlaying(true);
    if (state === 'ended') {
      stopSegmentWatcher();
      handleSegmentEnd();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video */}
      <View style={styles.videoContainer}>
        <YoutubePlayer
          ref={playerRef}
          height={VIDEO_HEIGHT}
          width={SCREEN_WIDTH}
          videoId={video.id}
          play={isPlaying}
          onReady={onPlayerReady}
          onChangeState={onPlayerStateChange}
          initialPlayerParams={{
            start: seg.startSeconds,
            end: seg.endSeconds,
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
        {/*
          Overlay that blocks all YouTube UI touches (links, cards, end screens).
          Uses onStartShouldSetResponder to claim touches at native level,
          which takes priority over the WKWebView's own gesture recognizers on iOS.
        */}
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
        />
      </View>

      {/* Controls — always below video, always visible */}
      <SafeAreaView style={styles.controlsArea}>
        <View style={styles.titleRow}>
          <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")}
        </Text>
          {segments.length > 1 && (
            <Text style={styles.segmentInfo}>
              Deel {currentSegmentIndex + 1} van {segments.length}
            </Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={() => setIsPlaying(p => !p)}
            activeOpacity={0.8}>
            <Text style={styles.playPauseIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  webView: {
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
  },
  controlsArea: {
    flex: 1,
    backgroundColor: '#111',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleRow: {
    marginBottom: 24,
  },
  videoTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 26,
  },
  segmentInfo: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseIcon: {
    fontSize: 28,
    color: '#fff',
  },
});
