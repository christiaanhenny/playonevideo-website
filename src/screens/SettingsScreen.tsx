import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { RootStackParamList, AppSettings, Folder } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';
import { AuthService } from '../services/AuthService';
import { SyncService } from '../services/SyncService';
import { ChevronLeft, ChevronRight, Link2, Play, Crown } from 'lucide-react-native';
import { PremiumService } from '../services/PremiumService';
import { useAppState } from '../context/AppStateContext';
import { useParentAuth } from '../hooks/useParentAuth';
import { ReviewPromptModal } from '../components/ReviewPromptModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

type ReviewEntry = { step: 'rating' | 'feedback'; category?: string };

export function SettingsScreen({ navigation }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isPaired, setIsPaired] = useState(false);
  const [subStatus, setSubStatus] = useState<'trial' | 'active' | 'none'>('none');
  const { isPremium, setIsPremium } = useAppState();
  const { navigateWithAuth } = useParentAuth();
  const [reviewEntry, setReviewEntry] = useState<ReviewEntry | null>(null);

  useEffect(() => {
    loadSettings();
    PremiumService.getSubscriptionStatus().then(setSubStatus);
  }, []);

  useFocusEffect(
    useCallback(() => {
      StorageService.getFolders().then(setFolders);
      SyncService.isPaired().then(setIsPaired);
    }, []),
  );

  const loadSettings = async () => {
    const [s, biometric, type, pinExists] = await Promise.all([
      StorageService.getSettings(),
      AuthService.isBiometricAvailable(),
      AuthService.getBiometricType(),
      StorageService.hasPin(),
    ]);
    setSettings(s);
    setBiometricAvailable(biometric);
    setBiometricType(type);
    setHasPin(pinExists);
  };

  const updateSetting = async (key: keyof AppSettings, value: boolean) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await StorageService.saveSettings({ [key]: value });
  };

  const handleChangePin = () => {
    Alert.alert(
      'Wijzig PIN',
      'Je wordt gevraagd een nieuwe PIN in te stellen.',
      [
        { text: 'Annuleer', style: 'cancel' },
        {
          text: 'Doorgaan',
          onPress: () => {
            navigation.navigate('ParentAuth', { returnTo: 'Settings', forceSetup: true });
          }},
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Sessiedata wissen',
      'Dit wist recente zoekopdrachten. Favorieten en instellingen blijven bewaard.',
      [
        { text: 'Annuleer', style: 'cancel' },
        {
          text: 'Wissen',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearRecentSearches();
            Alert.alert('Klaar', 'Sessiedata gewist.');
          }},
      ],
    );
  };

  if (!settings) return null;

  const Row = ({
    label,
    sublabel,
    value,
    onToggle,
    disabled,
    isLast}: {
    label: string;
    sublabel?: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    disabled?: boolean;
    isLast?: boolean;
  }) => (
    <View style={[styles.settingRow, isLast && styles.settingRowLast]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>{label}</Text>
        {sublabel && <Text style={styles.settingSubLabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
        thumbColor="#fff"
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={18} color={COLORS.primaryLight} />
          <Text style={styles.backText}>Terug</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instellingen</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Gezin — bovenaan voor zichtbaarheid */}
        <Text style={styles.sectionHeader}>Gezin</Text>
        <TouchableOpacity
          style={styles.syncCard}
          onPress={() => navigation.navigate('FamilySync')}
          activeOpacity={0.8}>
          <View style={styles.syncCardLeft}>
            <Link2 size={20} color={isPaired ? '#2E7D32' : COLORS.textSecondary} />
            <View style={styles.syncCardText}>
              <Text style={styles.syncCardTitle}>Apparaten koppelen</Text>
              <Text style={styles.syncCardSub}>
                {isPaired
                  ? 'Gekoppeld, lijsten lopen synchroon'
                  : 'Koppel de telefoon van je partner via QR'}
              </Text>
            </View>
          </View>
          <View style={styles.syncCardRight}>
            {isPaired && <View style={styles.pairedDot} />}
            <ChevronRight size={18} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Kinderen */}
        <Text style={styles.sectionHeader}>Kinderen</Text>
        <View style={styles.card}>
          {folders.length === 0 ? (
            <View style={[styles.actionRow, styles.actionRowLast]}>
              <Text style={[styles.actionLabel, { color: COLORS.textMuted }]}>Nog geen kinderen aangemaakt</Text>
            </View>
          ) : (
            folders.map((f, idx) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.actionRow, idx === folders.length - 1 && styles.actionRowLast]}
                onPress={() =>
                  Alert.alert(f.emoji + '  ' + f.name, undefined, [
                    { text: 'Instellingen', onPress: () => navigation.navigate('ChildSettings', { folderId: f.id }) },
                    { text: 'Kijkgeschiedenis', onPress: () => navigation.navigate('WatchHistory', { folderId: f.id }) },
                    {
                      text: 'Verwijder kind',
                      style: 'destructive',
                      onPress: () =>
                        Alert.alert(
                          `${f.name} verwijderen?`,
                          'Dit verwijdert het profiel en alle bijbehorende data.',
                          [
                            { text: 'Annuleer', style: 'cancel' },
                            {
                              text: 'Verwijder',
                              style: 'destructive',
                              onPress: async () => {
                                await StorageService.deleteFolder(f.id);
                                setFolders(prev => prev.filter(x => x.id !== f.id));
                              },
                            },
                          ],
                        ),
                    },
                    { text: 'Annuleer', style: 'cancel' },
                  ])
                }>
                <Text style={styles.childEmoji}>{f.emoji}</Text>
                <Text style={styles.actionLabel}>{f.name}</Text>
                <ChevronRight size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Authentication */}
        <Text style={styles.sectionHeader}>Beveiliging</Text>
        <View style={styles.card}>
          {biometricAvailable && (
            <Row
              label={`Gebruik ${biometricType ?? 'biometrie'}`}
              sublabel="Ontgrendel met Face ID of Touch ID"
              value={settings.biometricEnabled}
              onToggle={v => updateSetting('biometricEnabled', v)}
            />
          )}
          <TouchableOpacity
            style={[styles.actionRow, biometricAvailable && styles.actionRowBordered, styles.actionRowLast]}
            onPress={handleChangePin}>
            <Text style={styles.actionLabel}>{hasPin ? 'Wijzig PIN' : 'PIN instellen'}</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Session */}
        <Text style={styles.sectionHeader}>Sessie</Text>
        <View style={styles.card}>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Automatisch vergrendelen na 60s</Text>
              <Text style={styles.settingSubLabel}>Oudermode vervalt bij inactiviteit</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>60s</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.sectionHeader}>Inhoud</Text>
        <View style={styles.card}>
          <Row
            label="Favorieten"
            sublabel="Sla video's op voor snelle toegang"
            value={settings.favouritesEnabled}
            onToggle={v => updateSetting('favouritesEnabled', v)}
            isLast
          />
        </View>

        {/* Abonnement */}
        <Text style={styles.sectionHeader}>Abonnement</Text>
        <View style={styles.card}>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <Crown size={16} color={COLORS.textSecondary} style={styles.actionIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>
                {subStatus === 'trial' ? 'Gratis proefperiode actief' : subStatus === 'active' ? 'ParentVideo Pro' : 'Gratis versie'}
              </Text>
              <Text style={styles.settingSubLabel}>
                {subStatus === 'trial'
                  ? '14 dagen gratis, daarna €1,99/maand'
                  : subStatus === 'active'
                  ? '€1,99/maand · beheer via Apple ID → Abonnementen'
                  : 'Upgrade voor onbeperkte profielen en sync'}
              </Text>
            </View>
            {subStatus === 'none' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Paywall')}
                style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Feedback */}
        <Text style={styles.sectionHeader}>Feedback</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setReviewEntry({ step: 'rating' })}
            activeOpacity={0.7}>
            <Text style={styles.actionLabel}>Beoordeel deze app</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setReviewEntry({ step: 'feedback' })}
            activeOpacity={0.7}>
            <Text style={styles.actionLabel}>Stuur feedback</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={() => setReviewEntry({ step: 'feedback', category: 'Bug' })}
            activeOpacity={0.7}>
            <Text style={styles.actionLabel}>Meld een bug</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Data */}
        <Text style={styles.sectionHeader}>Gegevens</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.actionRow, styles.actionRowLast]} onPress={handleClearData}>
            <Text style={[styles.actionLabel, { color: COLORS.error }]}>Sessiedata wissen</Text>
            <ChevronRight size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Over */}
        <Text style={styles.sectionHeader}>Over</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={() => {
              Alert.alert(
                'Introductie opnieuw bekijken',
                'Wil je de introductie opnieuw starten?',
                [
                  { text: 'Annuleer', style: 'cancel' },
                  {
                    text: 'Herstart',
                    onPress: async () => {
                      await StorageService.resetOnboarding();
                      navigateWithAuth('Onboarding');
                    },
                  },
                ],
              );
            }}>
            <Play size={16} color={COLORS.textSecondary} fill={COLORS.textSecondary} style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Introductie opnieuw bekijken</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {__DEV__ && (
          <>
            <Text style={styles.sectionHeader}>Developer</Text>
            <View style={styles.card}>
              <View style={[styles.settingRow, styles.settingRowLast]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Premium simuleren</Text>
                  <Text style={styles.settingSubLabel}>
                    {isPremium ? 'Premium aan, glas actief' : 'Gratis, geen glas'}
                  </Text>
                </View>
                <Switch
                  value={isPremium}
                  onValueChange={setIsPremium}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor="#fff"
                  ios_backgroundColor={COLORS.border}
                />
              </View>
            </View>
          </>
        )}

        <Text style={styles.version}>PlayOneVideo · Gemaakt voor gezinnen</Text>
      </ScrollView>

      <ReviewPromptModal
        visible={reviewEntry !== null}
        onDismiss={() => setReviewEntry(null)}
        initialStep={reviewEntry?.step}
        initialCategory={reviewEntry?.category}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background},
  backBtn: { width: 70, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primaryLight,
    fontWeight: '600'},
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3},
  content: { paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8 },
  sectionHeader: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4},
  // Sync card — prominenter dan gewone rij
  syncCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1},
  syncCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  syncCardText: { flex: 1 },
  syncCardTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary},
  syncCardSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2},
  syncCardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pairedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50'},
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border},
  settingRowLast: {
    borderBottomWidth: 0},
  settingLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500'},
  settingLabelDisabled: { color: COLORS.textMuted },
  settingSubLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2},
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border},
  actionRowBordered: {
    borderTopWidth: 0},
  actionRowLast: {
    borderBottomWidth: 0},
  actionLabel: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500'},
  actionIcon: { marginRight: 4 },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8},
  badgeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '700'},
  childEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upgradeBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 36}});
