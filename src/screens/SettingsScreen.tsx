import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, AppSettings } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';
import { AuthService } from '../services/AuthService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export function SettingsScreen({ navigation }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

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
      'Change PIN',
      'You will be asked to set a new PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            navigation.navigate('ParentAuth', { returnTo: 'Settings', forceSetup: true });
          },
        },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Session Data',
      'This will clear recent searches and watch history. Favourites and settings are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearRecentSearches();
            Alert.alert('Done', 'Session data cleared.');
          },
        },
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
    isLast,
  }: {
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
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Folders */}
        <Text style={styles.sectionHeader}>Mappen</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={() => navigation.navigate('ManageFolders')}>
            <Text style={styles.actionLabel}>📁  Mappen beheren</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Authentication */}
        <Text style={styles.sectionHeader}>Authentication</Text>
        <View style={styles.card}>
          {biometricAvailable && (
            <Row
              label={`Use ${biometricType ?? 'Biometrics'}`}
              sublabel="Unlock with Face ID or Touch ID"
              value={settings.biometricEnabled}
              onToggle={v => updateSetting('biometricEnabled', v)}
            />
          )}
          <TouchableOpacity
            style={[styles.actionRow, biometricAvailable && styles.actionRowBordered]}
            onPress={handleChangePin}>
            <Text style={styles.actionLabel}>{hasPin ? 'Change PIN' : 'Set PIN'}</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Session */}
        <Text style={styles.sectionHeader}>Session</Text>
        <View style={styles.card}>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Auto-lock after 60 seconds</Text>
              <Text style={styles.settingSubLabel}>Parent mode expires when inactive</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>60s</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.sectionHeader}>Content</Text>
        <View style={styles.card}>
          <Row
            label="Favourites"
            sublabel="Save videos for quick access"
            value={settings.favouritesEnabled}
            onToggle={v => updateSetting('favouritesEnabled', v)}
            isLast
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionHeader}>Support</Text>
        <View style={styles.card}>
          <Row
            label="Show donation prompts"
            sublabel="Occasional reminders to support the app"
            value={settings.donationPromptsEnabled}
            onToggle={v => updateSetting('donationPromptsEnabled', v)}
            isLast
          />
        </View>

        {/* Data */}
        <Text style={styles.sectionHeader}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.actionRow, styles.actionRowLast]} onPress={handleClearData}>
            <Text style={[styles.actionLabel, { color: COLORS.error }]}>Clear Session Data</Text>
            <Text style={[styles.actionChevron, { color: COLORS.error }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>PlayOneVideo · Built with care for families</Text>
      </ScrollView>
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
    backgroundColor: COLORS.background,
  },
  backBtn: { width: 70 },
  backText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  content: { paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8 },
  sectionHeader: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  settingLabelDisabled: { color: COLORS.textMuted },
  settingSubLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionRowBordered: {
    borderTopWidth: 0,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionLabel: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  actionChevron: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textMuted,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 36,
  },
});
