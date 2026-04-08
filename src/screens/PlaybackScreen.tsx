import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Playback'>;
  route: RouteProp<RootStackParamList, 'Playback'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * 9 / 16);

// Fallback: drop glass after this many seconds even if play never detected
const GLASS_FALLBACK_SECONDS = 30;

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

  const [playerReady, setPlayerReady] = useState(false);
  const [glassOn, setGlassOn] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);

  const glassTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playDetected = useRef(false);
  const seg = segments[0];

  const dropGlassAfter = (ms: number) => {
    if (glassTimer.current) clearTimeout(glassTimer.current);
    glassTimer.current = setTimeout(() => setGlassOn(true), ms);
  };

  // Fallback: drop glass after 30s regardless
  useEffect(() => {
    if (!playerReady) return;
    dropGlassAfter(GLASS_FALLBACK_SECONDS * 1000);
    return () => { if (glassTimer.current) clearTimeout(glassTimer.current); };
  }, [playerReady]);

  const handleExit = () => {
    if (glassTimer.current) clearTimeout(glassTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    navigation.reset({ index: 0, routes: [{ name: 'LockedHome' }] });
  };

  const onStateChange = (state: string) => {
    if (state === 'playing' && !playDetected.current) {
      // First play detected — drop glass after 1 second
      playDetected.current = true;
      dropGlassAfter(1000);
    }
    if (state === 'ended') {
      if (glassTimer.current) clearTimeout(glassTimer.current);
      navigation.replace('Finished');
    }
  };

  const onError = (error: string) => {
    const code = Number(error);
    if (code === 101 || code === 150) setEmbedBlocked(true);
  };

  if (embedBlocked) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <SafeAreaView style={styles.centerSafe}>
          <Text style={styles.errorEmoji}>🚫</Text>
          <Text style={styles.errorTitle}>Video niet beschikbaar</Text>
          <Text style={styles.errorBody}>
            Deze video mag niet buiten YouTube worden afgespeeld.{'\n'}
            Kies een andere video.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={handleExit}>
            <Text style={styles.backBtnText}>← Terug</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ── LAAG 1: YouTube player ── */}
      <View style={styles.videoWrapper}>
        <View style={styles.videoContainer}>
          <YoutubePlayer
            height={VIDEO_HEIGHT}
            width={SCREEN_WIDTH}
            videoId={video.id}
            play={false}
            onReady={() => setPlayerReady(true)}
            onChangeState={onStateChange}
            onError={onError}
            initialPlayerParams={{
              start: seg.startSeconds,
              controls: true,
              rel: false,
              modestbranding: true,
              iv_load_policy: 3,
              fs: false,
            }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
              allowsFullscreenVideo: false,
              scrollEnabled: false,
              bounces: false,
            }}
          />

          {/* Spinner */}
          {!playerReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {/* ── LAAG 2: Glas ── */}
          {glassOn && (
            <View
              style={StyleSheet.absoluteFill}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
            />
          )}
        </View>
      </View>

      {/* ── LAAG 3: Onze knoppen ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

        {/* Bovenste balk: exit + countdown */}
        <SafeAreaView pointerEvents="box-none">
          <View style={styles.topBar} pointerEvents="box-none">
            <TouchableOpacity style={styles.exitCircle} onPress={handleExit} activeOpacity={0.7}>
              <Text style={styles.exitIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Onderste balk: pauze knop (alleen als glas aan is) */}
        {glassOn && (
          <View style={styles.bottomControls} pointerEvents="box-none">
            <Text style={styles.videoTitle} numberOfLines={2}>
              {decodeHtml(video.title)}
            </Text>
            <TouchableOpacity onPress={handleExit} activeOpacity={0.7}>
              <Text style={styles.backText}>Video werkt niet? ← Terug</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },

  videoWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoContainer: { width: SCREEN_WIDTH, height: VIDEO_HEIGHT, backgroundColor: '#000' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  exitCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitIcon: { fontSize: 16, color: '#fff', fontWeight: '600' },
  countdownBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  countdownText: {
    color: '#fff',
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },

  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 52,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 16,
  },
  videoTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playPauseIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
  backText: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },

  centerSafe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorEmoji: { fontSize: 56 },
  errorTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: '#fff', textAlign: 'center' },
  errorBody: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
});
