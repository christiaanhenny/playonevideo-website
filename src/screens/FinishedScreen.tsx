import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Finished'>;
};

export function FinishedScreen({ navigation }: Props) {
  const dimAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleIn, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const dimTimer = setTimeout(() => {
      Animated.timing(dimAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    }, 15_000);

    return () => clearTimeout(dimTimer);
  }, []);

  const handleUnlock = () => {
    navigation.navigate('ParentAuth', { returnTo: 'Search' });
  };

  const overlayOpacity = dimAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.finishedBg} />
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>

        {/* Check badge */}
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: scaleIn }] }]}>
          <View style={styles.checkRing}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          </View>
        </Animated.View>

        {/* Message */}
        <View style={styles.messageArea}>
          <Text style={styles.heading}>All done</Text>
          <Text style={styles.subheading}>That was the video for now.</Text>
        </View>

        {/* Parent unlock */}
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={handleUnlock}
          activeOpacity={0.8}>
          <Text style={styles.unlockText}>Parent Unlock</Text>
        </TouchableOpacity>

        {/* Dim overlay */}
        <Animated.View
          style={[styles.dimOverlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        />
      </Animated.View>
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
  checkIcon: {
    fontSize: 38,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '300',
  },
  messageArea: {
    alignItems: 'center',
    gap: 10,
  },
  heading: {
    fontSize: FONTS.sizes.xxxl + 4,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 2,
  },
  subheading: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  unlockButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
  },
  unlockText: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
});
