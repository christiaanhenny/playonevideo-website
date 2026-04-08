import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        useNativeDriver: true}),
      Animated.spring(scaleIn, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true}),
    ]).start();

    const dimTimer = setTimeout(() => {
      Animated.timing(dimAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true}).start();
    }, 15_000);

    return () => clearTimeout(dimTimer);
  }, []);

  const handleUnlock = () => {
    navigation.navigate('ParentAuth', { returnTo: 'LockedHome' });
  };

  const overlayOpacity = dimAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8]});

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
          <Text style={styles.subheading}>Goed gedaan! Dat was de video voor nu.</Text>
          <Text style={styles.heading}>Klaar! 🎉</Text>
        </View>

        {/* Parent unlock */}
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={handleUnlock}
          activeOpacity={0.8}>
          <Text style={styles.unlockLabel}>Ouder?</Text>
          <Text style={styles.unlockText}>Tik hier om te ontgrendelen</Text>
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
    backgroundColor: COLORS.finishedBg},
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 40},
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center'},
  checkRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center'},
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center'},
  checkIcon: {
    fontSize: 38,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '300'},
  messageArea: {
    alignItems: 'center',
    gap: 10},
  heading: {
    fontSize: FONTS.sizes.xxxl + 4,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0,
    textAlign: 'center'},
  subheading: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.3},
  unlockButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignItems: 'center',
    gap: 2},
  unlockLabel: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600'},
  unlockText: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
    fontWeight: '500'},
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000'}});
