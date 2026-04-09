import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Rect, Line, Path } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

// ─── Custom icons ─────────────────────────────────────────────────────────────

function IconFrustration({ isTablet }: { isTablet: boolean }) {
  return (
    <Svg width={52} height={52} viewBox="0 0 52 52" fill="none">
      <Circle cx="26" cy="26" r="20" stroke={COLORS.textPrimary} strokeWidth="2" />
      <Path d="M16 18 L22 21" stroke={COLORS.textPrimary} strokeWidth="2" strokeLinecap="round" />
      <Path d="M36 18 L30 21" stroke={COLORS.textPrimary} strokeWidth="2" strokeLinecap="round" />
      <Path d="M19 24 Q20 22 21 24" stroke={COLORS.textPrimary} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Path d="M31 24 Q32 22 33 24" stroke={COLORS.textPrimary} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Path d="M19 34 Q26 29 33 34" stroke={COLORS.textPrimary} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M19 26 Q18 28 19 30" stroke={COLORS.textSecondary} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Path d="M33 26 Q34 28 33 30" stroke={COLORS.textSecondary} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function IconDesign() {
  return (
    <Svg width={52} height={48} viewBox="0 0 52 48" fill="none">
      <Rect x="4" y="6" width="44" height="36" rx="6" stroke={COLORS.textPrimary} strokeWidth="2" />
      <Rect x="12" y="14" width="16" height="4" rx="2" fill={COLORS.border} />
      <Rect x="12" y="22" width="28" height="4" rx="2" fill={COLORS.border} />
      <Rect x="12" y="30" width="20" height="4" rx="2" fill={COLORS.border} />
    </Svg>
  );
}

function IconShare() {
  return (
    <Svg width={56} height={48} viewBox="0 0 56 48" fill="none">
      <Rect x="2" y="10" width="16" height="28" rx="4" stroke={COLORS.textPrimary} strokeWidth="2" />
      <Line x1="2" y1="34" x2="18" y2="34" stroke={COLORS.textPrimary} strokeWidth="1.5" />
      <Rect x="38" y="10" width="16" height="28" rx="4" stroke={COLORS.textPrimary} strokeWidth="2" />
      <Line x1="38" y1="34" x2="54" y2="34" stroke={COLORS.textPrimary} strokeWidth="1.5" />
      <Line x1="22" y1="24" x2="34" y2="24" stroke={COLORS.textSecondary} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M31 21L34 24L31 27" stroke={COLORS.textSecondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 19 C9 17.5 11 17.5 11 19 C11 20.5 9 22 9 22 C9 22 7 20.5 7 19 C7 17.5 9 17.5 9 19Z" fill={COLORS.textSecondary} />
    </Svg>
  );
}

function IconCelebrate() {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Path d="M24 6L27.5 17H39L29.75 23.5L33.25 34.5L24 28L14.75 34.5L18.25 23.5L9 17H20.5L24 6Z"
        stroke={COLORS.textPrimary} strokeWidth="2" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// ─── Stap-data ─────────────────────────────────────────────────────────────────

interface Step {
  id: string;
  title: string;
  subtitle: string;
  icon: 'logo' | 'frustration' | 'howItWorks' | 'design' | 'share' | 'celebrate';
}

const STEPS: Step[] = [
  {
    id: 'intro',
    icon: 'logo',
    title: 'Één filmpje.\nGeen gedoe.',
    subtitle: 'Geen eindeloze afspeellijsten.\nGeen doorklikkende kinderen.\nGeen ruzie.',
  },
  {
    id: 'problem',
    icon: 'frustration',
    title: 'Ken je dit?',
    subtitle: '', // dynamisch ingevuld op basis van apparaat
  },
  {
    id: 'howItWorks',
    icon: 'howItWorks',
    title: 'Hoe het werkt',
    subtitle: '',
  },
  {
    id: 'design',
    icon: 'design',
    title: 'Expres rustig\ngehouden',
    subtitle: 'Geen felle kleuren. Geen animaties. Geen scores of beloningen.\n\nDe interface prikkelt niet, zodat de aandacht bij het filmpje blijft en niet bij de app.',
  },
  {
    id: 'share',
    icon: 'share',
    title: 'Deel lijsten\ntussen partners',
    subtitle: '', // dynamisch ingevuld op basis van apparaat
  },
  {
    id: 'done',
    icon: 'celebrate',
    title: 'Klaar om\nte beginnen!',
    subtitle: 'Voeg je eerste kind toe en kies\neen video. Gewoon één.',
  },
];

const HOW_ROWS = [
  { n: 1, text: 'Jij kiest het filmpje' },
  { n: 2, text: 'Kind kijkt rustig' },
  { n: 3, text: 'Scherm wordt zwart' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function OnboardingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;

  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // Apparaat-specifieke teksten
  const device = isTablet ? 'tablet' : 'telefoon';
  const dynamicSubtitle =
    current.id === 'problem'
      ? `"Ik kijk echt maar één filmpje..."\n(45 minuten later)\n\n"Maar dit filmpje is ook zo goed!"\n\nEn dan de tranen als de ${device} weg moet.`
      : current.id === 'share'
      ? `Koppel de ${device} van je partner via een QR-code.\n\nDe favoriete filmpjes van je kinderen worden automatisch gedeeld tussen jullie, op beide toestellen altijd up-to-date.`
      : current.subtitle;

  const animateToStep = (next: number, direction: 'forward' | 'back' = 'forward') => {
    const outOffset = direction === 'forward' ? -40 : 40;
    const inOffset = direction === 'forward' ? 40 : -40;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: outOffset, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      stepRef.current = next;
      setStep(next);
      slideAnim.setValue(inOffset);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        const cur = stepRef.current;
        if (g.dx < -40 && cur < STEPS.length - 1) {
          animateToStep(cur + 1, 'forward');
        } else if (g.dx > 40 && cur > 0) {
          animateToStep(cur - 1, 'back');
        }
      },
    }),
  ).current;

  const handleNext = () => {
    if (isLast) finish();
    else animateToStep(step + 1, 'forward');
  };

  const handleBack = () => {
    if (!isFirst) animateToStep(step - 1, 'back');
  };

  const finish = async () => {
    await StorageService.setOnboardingComplete();
    navigation.replace('LockedHome');
  };

  const renderIcon = () => {
    if (current.icon === 'logo') {
      return (
        <Image
          source={require('../assets/logo.png')}
          style={styles.logoIcon}
          resizeMode="cover"
        />
      );
    }
    if (current.icon === 'howItWorks') {
      return (
        <View style={styles.howIconRow}>
          {[1, 2, 3].map((n, i) => (
            <React.Fragment key={n}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{n}</Text>
              </View>
              {i < 2 && <View style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.iconWrap}>
        {current.icon === 'frustration' && <IconFrustration isTablet={isTablet} />}
        {current.icon === 'design' && <IconDesign />}
        {current.icon === 'share' && <IconShare />}
        {current.icon === 'celebrate' && <IconCelebrate />}
      </View>
    );
  };

  // ── Layout: landscape = zij-aan-zij, portrait = stapel ──────────────────────
  const maxContentWidth = isTablet ? 560 : width;
  const contentPadding = isTablet ? 48 : 36;

  const iconBlock = (
    <View style={[styles.iconArea, isLandscape && styles.iconAreaLandscape]}>
      {renderIcon()}
    </View>
  );

  const textBlock = (
    <View style={[
      styles.textBlock,
      isLandscape && styles.textBlockLandscape,
      { paddingHorizontal: isLandscape ? 0 : contentPadding },
    ]}>
      <Text style={[styles.title, isTablet && styles.titleTablet, isLandscape && styles.titleLandscape]}>
        {current.title}
      </Text>

      {current.icon === 'howItWorks' ? (
        <View style={styles.howSteps}>
          {HOW_ROWS.map(({ n, text }) => (
            <View key={n} style={styles.howRow}>
              <View style={styles.howBadge}>
                <Text style={styles.howBadgeText}>{n}</Text>
              </View>
              <Text style={styles.howRowText}>{text}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
          {dynamicSubtitle}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Overslaan — alleen zichtbaar als niet laatste stap */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={finish}>
          <Text style={styles.skipText}>Overslaan</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          isLandscape && styles.contentLandscape,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
          { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' },
        ]}>
        {isLandscape ? (
          <>
            {iconBlock}
            {textBlock}
          </>
        ) : (
          <>
            {iconBlock}
            {textBlock}
          </>
        )}
      </Animated.View>

      {/* Bottom navigatie */}
      <View style={[styles.bottom, isLandscape && styles.bottomLandscape]}>
        {/* Terug-knop */}
        <TouchableOpacity
          style={[styles.backBtn, isFirst && styles.backBtnHidden]}
          onPress={handleBack}
          activeOpacity={0.7}
          disabled={isFirst}>
          <Text style={styles.backBtnText}>← Terug</Text>
        </TouchableOpacity>

        {/* Dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? COLORS.textPrimary : COLORS.border,
                  width: i === step ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        {/* Volgende / Begin */}
        <TouchableOpacity
          style={[styles.nextBtn, isLandscape && styles.nextBtnLandscape]}
          onPress={handleNext}
          activeOpacity={0.85}>
          <Text style={styles.nextText}>
            {isLast ? 'Begin' : 'Volgende'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // ── Content ─────────────────────────────────────────────
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  contentLandscape: {
    flexDirection: 'row',
    gap: 0,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },

  // ── Icoon ────────────────────────────────────────────────
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconAreaLandscape: {
    flex: 1,
    marginBottom: 0,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  howIconRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  stepLine: {
    width: 16,
    height: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },

  // ── Tekst ────────────────────────────────────────────────
  textBlock: {
    alignItems: 'center',
    gap: 16,
  },
  textBlockLandscape: {
    flex: 1.4,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 32,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
  },
  titleTablet: {
    fontSize: 38,
    lineHeight: 48,
  },
  titleLandscape: {
    textAlign: 'left',
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  subtitleTablet: {
    fontSize: FONTS.sizes.lg,
    lineHeight: 30,
  },

  // ── Hoe het werkt ─────────────────────────────────────────
  howSteps: {
    gap: 10,
    width: '100%',
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  howBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howBadgeText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  howRowText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  // ── Bottom navigatie ──────────────────────────────────────
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  bottomLandscape: {
    paddingBottom: 16,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    minWidth: 72,
  },
  backBtnHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  backBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: COLORS.textPrimary,
    minWidth: 120,
    alignItems: 'center',
  },
  nextBtnLandscape: {
    paddingVertical: 12,
  },
  nextText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
});
