import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Folder, WatchHistoryEntry } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';
import { ReviewService } from '../services/ReviewService';
import { useAppState } from '../context/AppStateContext';
import { useParentAuth } from '../hooks/useParentAuth';
import { Check } from 'lucide-react-native';
import { ReviewPromptModal } from '../components/ReviewPromptModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Finished'>;
};

export function FinishedScreen({ navigation }: Props) {
  const { activeChildId, lastPlayedVideo } = useAppState();
  const { navigateWithAuth } = useParentAuth();
  const dimAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.8)).current;
  const [folder, setFolder] = useState<Folder | null>(null);
  const [dailyCount, setDailyCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const reviewShouldShow = useRef(false);

  // Capture current values in refs so the async function always has fresh data
  const activeChildIdRef = useRef(activeChildId);
  const lastPlayedVideoRef = useRef(lastPlayedVideo);
  activeChildIdRef.current = activeChildId;
  lastPlayedVideoRef.current = lastPlayedVideo;

  useEffect(() => {
    recordAndLoad();

    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();

    const dimTimer = setTimeout(() => {
      Animated.timing(dimAnim, { toValue: 1, duration: 3000, useNativeDriver: true }).start();
    }, 15_000);

    return () => clearTimeout(dimTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordAndLoad = async () => {
    const childId = activeChildIdRef.current;
    const video = lastPlayedVideoRef.current;
    if (!childId) return;

    const folders = await StorageService.getFolders();
    const f = folders.find(x => x.id === childId) ?? null;
    setFolder(f);

    if (video) {
      const entry: WatchHistoryEntry = {
        id: `${Date.now()}_${video.id}`,
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        watchedAt: Date.now(),
        durationSeconds: video.durationSeconds ?? 0,
      };
      await StorageService.addWatchHistoryEntry(childId, entry);
    }

    const newCount = await StorageService.incrementDailyWatchCount(childId);
    setDailyCount(newCount);

    if (f?.dailyLimit && f.dailyLimit > 0 && newCount >= f.dailyLimit) {
      setLimitReached(true);
    }

    await StorageService.incrementTotalVideosWatched();
    const shouldReview = await ReviewService.shouldShowReview();
    if (shouldReview) {
      reviewShouldShow.current = true;
      // Kleine vertraging zodat de finished-animatie eerst afspeelt
      setTimeout(() => setShowReview(true), 1500);
    }
  };

  const handleReviewDismiss = useCallback(async () => {
    setShowReview(false);
    // Markeer als getoond pas nadat de gebruiker de modal daadwerkelijk ziet en sluit
    if (reviewShouldShow.current) {
      reviewShouldShow.current = false;
      await ReviewService.markShown();
    }
  }, []);

  const handleUnlock = () => {
    navigateWithAuth('LockedHome');
  };

  const overlayOpacity = dimAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const endMessage = folder?.endMessage?.trim() || null;
  const childName = folder?.name ?? null;

  const defaultHeading = 'Klaar! 🎉';
  const defaultSub = childName
    ? `Goed gedaan ${childName}! Dat was de video voor nu.`
    : 'Goed gedaan! Dat was de video voor nu.';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.finishedBg} />
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>

        {/* Check badge */}
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: scaleIn }] }]}>
          <View style={styles.checkRing}>
            <View style={styles.checkCircle}>
              <Check size={38} color="rgba(255,255,255,0.85)" strokeWidth={2} />
            </View>
          </View>
        </Animated.View>

        {/* Bericht */}
        <View style={styles.messageArea}>
          {endMessage ? (
            <>
              <Text style={styles.heading}>Klaar! 🎉</Text>
              <Text style={styles.subheading}>{endMessage}</Text>
            </>
          ) : (
            <>
              <Text style={styles.subheading}>{defaultSub}</Text>
              <Text style={styles.heading}>{defaultHeading}</Text>
            </>
          )}

          {limitReached && folder?.dailyLimit ? (
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>
                Je hebt vandaag {folder.dailyLimit} {folder.dailyLimit === 1 ? 'video' : "video's"} gekeken. Dat is het limiet voor vandaag!
              </Text>
            </View>
          ) : activeChildId && folder?.dailyLimit ? (
            <View style={styles.limitBadgeLight}>
              <Text style={styles.limitTextLight}>
                Video {dailyCount} van {folder.dailyLimit} voor vandaag
              </Text>
            </View>
          ) : null}
        </View>

        {/* Ouder ontgrendelen */}
        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock} activeOpacity={0.8}>
          <Text style={styles.unlockLabel}>Ouder?</Text>
          <Text style={styles.unlockText}>Tik hier om te ontgrendelen</Text>
        </TouchableOpacity>

        {/* Dim overlay */}
        <Animated.View
          style={[styles.dimOverlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        />
      </Animated.View>

      <ReviewPromptModal
        visible={showReview}
        onDismiss={handleReviewDismiss}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.finishedBg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 40,
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageArea: {
    alignItems: 'center',
    gap: 10,
  },
  heading: {
    fontSize: FONTS.sizes.xxxl + 4,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0,
    textAlign: 'center',
  },
  subheading: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  limitBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  limitText: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    fontWeight: '500',
  },
  limitBadgeLight: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  limitTextLight: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
  unlockButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignItems: 'center',
    gap: 2,
  },
  unlockLabel: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  unlockText: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
});
