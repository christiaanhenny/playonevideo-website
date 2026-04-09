import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, FONTS } from '../constants';

// ── Vervang met je echte store-ID's ──────────────────────────────────────────
const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000?action=write-review';
const PLAY_STORE_URL = 'market://details?id=com.yourpackage';
const FEEDBACK_EMAIL = 'feedback@yourdomain.com';
const APP_NAME = 'Parent Controlled Video';
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Bug',
  'Iets verwarrends',
  'Functieverzoek',
  'Voldeed niet aan verwachtingen',
  'Anders',
];

type Step = 'rating' | 'thankyou' | 'feedback';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  /** Open direct op een specifieke stap (standaard: sterrenbeoordeling) */
  initialStep?: Step;
  /** Pre-selecteer een feedbackcategorie bij de 'feedback'-stap */
  initialCategory?: string;
}

export function ReviewPromptModal({ visible, onDismiss, initialStep, initialCategory }: Props) {
  const [step, setStep] = useState<Step>(initialStep ?? 'rating');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory ?? null);
  const [feedbackText, setFeedbackText] = useState('');
  const [email, setEmail] = useState('');

  // Reset naar de juiste beginstap elke keer dat de modal opent
  useEffect(() => {
    if (!visible) return;
    setStep(initialStep ?? 'rating');
    setSelectedCategory(initialCategory ?? null);
    setFeedbackText('');
    setEmail('');
  }, [visible, initialStep, initialCategory]);

  const handleDismiss = useCallback(() => {
    onDismiss();
    // Geen state-reset hier: de useEffect handelt dit bij heropenen af,
    // zodat de modal niet flitst naar de beginstap tijdens de sluit-animatie.
  }, [onDismiss]);

  const handleStarPress = (star: number) => {
    setStep(star >= 4 ? 'thankyou' : 'feedback');
  };

  const handleOpenStore = () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url).catch(() => {});
    handleDismiss();
  };

  const handleSendFeedback = () => {
    const category = selectedCategory ?? 'Algemeen';
    const bodyParts = [`Categorie: ${category}`];
    if (feedbackText) bodyParts.push(`\nBericht:\n${feedbackText}`);

    const mailUrl =
      `mailto:${FEEDBACK_EMAIL}` +
      `?subject=${encodeURIComponent(`Feedback — ${APP_NAME}`)}` +
      `&body=${encodeURIComponent(bodyParts.join(''))}`;

    Linking.openURL(mailUrl).catch(() => {});
    handleDismiss();
  };

  const sendEnabled = !!(selectedCategory || feedbackText.trim());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleDismiss} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>

          {/* ── Stap 1: Sterrenbeoordeling ── */}
          {step === 'rating' && (
            <>
              <Text style={styles.title}>Hoe bevalt {APP_NAME} je tot nu toe?</Text>
              <Text style={styles.subtitle}>Je ervaring is echt belangrijk voor ons.</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleStarPress(star)}
                    activeOpacity={0.7}
                    style={styles.starBtn}
                  >
                    <Text style={styles.starChar}>☆</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}>
                <Text style={styles.notNow}>Niet nu</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stap 2a: Bedankt → store ── */}
          {step === 'thankyou' && (
            <>
              <Text style={styles.plantEmoji}>🌿</Text>
              <Text style={styles.title}>Heel erg bedankt</Text>
              <Text style={styles.subtitle}>
                Wil je {APP_NAME} beoordelen in de store? Het helpt echt.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenStore} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Beoordeel de app</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}>
                <Text style={styles.notNow}>Niet nu</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stap 2b: Feedbackformulier ── */}
          {step === 'feedback' && (
            <ScrollView
              style={styles.feedbackScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title}>Bedankt dat je het ons vertelt</Text>
              <Text style={styles.subtitle}>Wat kunnen we verbeteren?</Text>

              <View style={styles.chipsRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.textArea}
                placeholder="Vertel ons meer..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                value={feedbackText}
                onChangeText={setFeedbackText}
                textAlignVertical="top"
              />

              <TextInput
                style={styles.emailInput}
                placeholder="E-mail (optioneel, voor follow-up)"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, !sendEnabled && styles.primaryBtnDisabled]}
                onPress={handleSendFeedback}
                activeOpacity={0.85}
                disabled={!sendEnabled}
              >
                <Text style={styles.primaryBtnText}>Stuur feedback</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDismiss} style={styles.cancelBtn} hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}>
                <Text style={styles.notNow}>Annuleren</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const SHEET_RADIUS = 28;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#F5F2EE',
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
    alignItems: 'center',
  },
  feedbackScroll: {
    width: '100%',
  },
  plantEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  starBtn: {
    padding: 4,
  },
  starChar: {
    fontSize: 44,
    color: COLORS.accentLight,
  },
  notNow: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  cancelBtn: {
    marginTop: 4,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#4A7C59',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  chipSelected: {
    borderColor: '#4A7C59',
    backgroundColor: 'rgba(74,124,89,0.08)',
  },
  chipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
  },
  chipTextSelected: {
    color: '#4A7C59',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    backgroundColor: '#fff',
    minHeight: 100,
    marginBottom: 12,
    width: '100%',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    backgroundColor: '#fff',
    marginBottom: 16,
    width: '100%',
  },
});
