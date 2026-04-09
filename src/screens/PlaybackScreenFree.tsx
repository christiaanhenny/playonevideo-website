/**
 * PlaybackScreenFree — GRATIS versie zonder glas-overlay
 * ========================================================
 * YouTube controls zijn zichtbaar. Geen glas.
 * Voor aanpassingen aan de premium versie: zie PlaybackScreenPremium.tsx
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';
import { useAppState } from '../context/AppStateContext';
import { Ban, X } from 'lucide-react-native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Playback'>;
  route: RouteProp<RootStackParamList, 'Playback'>;
};

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function PlaybackScreenFree({ navigation, route }: Props) {
  const { config } = route.params;
  const { video, segments } = config;
  const { setLastPlayedVideo } = useAppState();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const videoWidth = width;
  const videoHeight = isLandscape ? height : Math.round(width * 9 / 16);


  const [playerReady, setPlayerReady] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const endedRef = useRef(false);
  const seg = segments[0];

  const handleExit = () => {
    navigation.reset({ index: 0, routes: [{ name: 'LockedHome' }] });
  };

  const onStateChange = (state: string) => {
    if (state === 'ended' && !endedRef.current) {
      endedRef.current = true;
      setLastPlayedVideo(video);
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
          <Ban size={56} color={COLORS.error} style={{ marginBottom: 8 }} />
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

      <View style={styles.videoWrapper}>
        <View style={{ width: videoWidth, height: videoHeight, backgroundColor: '#000' }}>
          <YoutubePlayer
            height={videoHeight}
            width={videoWidth}
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
              allowsAirPlayForMediaPlayback: true,
              scrollEnabled: false,
              bounces: false,
            }}
          />

          {!playerReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>
      </View>

      {/* Sluit-knop */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <SafeAreaView pointerEvents="box-none">
          <View style={styles.topBar} pointerEvents="box-none">
            <TouchableOpacity style={styles.exitCircle} onPress={handleExit} activeOpacity={0.7}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={styles.bottomControls} pointerEvents="box-none">
          <Text style={styles.videoTitle} numberOfLines={2}>
            {decodeHtml(video.title)}
          </Text>
          <TouchableOpacity onPress={handleExit} activeOpacity={0.7}>
            <Text style={styles.backText}>← Terug</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  videoWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exitCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
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
