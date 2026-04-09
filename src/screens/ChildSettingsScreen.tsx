import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Folder, TimeSlot } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Tv } from 'lucide-react-native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChildSettings'>;
  route: RouteProp<RootStackParamList, 'ChildSettings'>;
};

const THEMES = [
  { keyword: 'dinosaurussen kinderen', label: 'Dinosaurussen', emoji: '🦕' },
  { keyword: 'treinen kinderen', label: 'Treinen', emoji: '🚂' },
  { keyword: 'dieren natuur kinderen', label: 'Dieren', emoji: '🐾' },
  { keyword: 'ruimte planeten kinderen', label: 'Ruimte', emoji: '🚀' },
  { keyword: 'knutselen kinderen', label: 'Knutselen', emoji: '🎨' },
  { keyword: 'wetenschap experimenten kinderen', label: 'Wetenschap', emoji: '🔬' },
  { keyword: 'prentenboek verhaal kinderen', label: 'Verhalen', emoji: '📖' },
  { keyword: 'kinderliedjes muziek', label: 'Muziek', emoji: '🎵' },
  { keyword: 'voetbal sport kinderen', label: 'Sport', emoji: '⚽' },
  { keyword: 'koken kinderen recept', label: 'Koken', emoji: '🍳' },
];

const DAILY_LIMITS = [
  { value: 1, label: '1 video' },
  { value: 2, label: '2 video\'s' },
  { value: 3, label: '3 video\'s' },
  { value: 5, label: '5 video\'s' },
  { value: 0, label: 'Onbeperkt' },
];

const TIME_OPTIONS: Array<{ h: number; m: number; label: string }> = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push({ h, m: 0, label: `${h.toString().padStart(2, '0')}:00` });
  TIME_OPTIONS.push({ h, m: 30, label: `${h.toString().padStart(2, '0')}:30` });
}

function TimeWheelPicker({
  value,
  onChange,
  label,
}: {
  value: { h: number; m: number };
  onChange: (h: number, m: number) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const current = `${value.h.toString().padStart(2, '0')}:${value.m.toString().padStart(2, '0')}`;

  return (
    <View>
      <Text style={styles.timeLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.timePill}
        onPress={() => setOpen(!open)}>
        <Text style={styles.timePillText}>{current}</Text>
        {open ? <ChevronUp size={14} color={COLORS.textSecondary} /> : <ChevronDown size={14} color={COLORS.textSecondary} />}
      </TouchableOpacity>
      {open && (
        <ScrollView
          style={styles.timeDropdown}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          {TIME_OPTIONS.map(opt => {
            const active = opt.h === value.h && opt.m === value.m;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[styles.timeOption, active && styles.timeOptionActive]}
                onPress={() => { onChange(opt.h, opt.m); setOpen(false); }}>
                <Text style={[styles.timeOptionText, active && styles.timeOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

export function ChildSettingsScreen({ navigation, route }: Props) {
  const { folderId } = route.params;
  const [folder, setFolder] = useState<Folder | null>(null);
  const [endMessage, setEndMessage] = useState('');
  const [dailyLimit, setDailyLimit] = useState(0);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>({
    enabled: false,
    startHour: 15,
    startMinute: 0,
    endHour: 19,
    endMinute: 0,
  });
  const [themeKeyword, setThemeKeyword] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [folderId]);

  const load = async () => {
    const folders = await StorageService.getFolders();
    const f = folders.find(x => x.id === folderId);
    if (!f) return;
    setFolder(f);
    setEndMessage(f.endMessage ?? '');
    setDailyLimit(f.dailyLimit ?? 0);
    setThemeKeyword(f.themeKeyword);
    if (f.timeSlot) {
      setTimeSlot(f.timeSlot);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await StorageService.updateFolderSettings(folderId, {
      endMessage: endMessage.trim() || undefined,
      dailyLimit,
      timeSlot,
      themeKeyword,
    });
    setSaving(false);
    navigation.goBack();
  };

  const handleClearHistory = () => {
    if (!folder) return;
    Alert.alert(
      'Geschiedenis wissen',
      `Wis alle kijkgeschiedenis van ${folder.name}?`,
      [
        { text: 'Annuleer', style: 'cancel' },
        {
          text: 'Wissen',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearWatchHistory(folderId);
            Alert.alert('Klaar', 'Kijkgeschiedenis gewist.');
          },
        },
      ],
    );
  };

  if (!folder) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={18} color={COLORS.primaryLight} />
          <Text style={styles.backText}>Terug</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{folder.emoji} {folder.name}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          <Text style={[styles.saveText, saving && { opacity: 0.4 }]}>
            {saving ? '...' : 'Opslaan'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* End message */}
        <Text style={styles.sectionHeader}>Berichtje na de video</Text>
        <View style={styles.card}>
          <Text style={styles.cardHint}>
            Dit ziet het kind als de video klaar is. Laat leeg voor de standaardtekst.
          </Text>
          <TextInput
            style={styles.messageInput}
            value={endMessage}
            onChangeText={setEndMessage}
            placeholder={`Goed gedaan ${folder.name}! Nu buiten spelen 🌳`}
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={120}
          />
          <Text style={styles.charCount}>{endMessage.length}/120</Text>
        </View>

        {/* Daily limit */}
        <Text style={styles.sectionHeader}>Dagelijks limiet</Text>
        <View style={styles.card}>
          <Text style={styles.cardHint}>
            Hoeveel video's mag {folder.name} per dag kijken?
          </Text>
          <View style={styles.chipRow}>
            {DAILY_LIMITS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, dailyLimit === opt.value && styles.chipActive]}
                onPress={() => setDailyLimit(opt.value)}>
                <Text style={[styles.chipText, dailyLimit === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time slot */}
        <Text style={styles.sectionHeader}>Kijktijden</Text>
        <View style={styles.card}>
          <View style={styles.slotToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.slotToggleLabel}>Kijktijden instellen</Text>
              <Text style={styles.slotToggleSub}>App alleen beschikbaar in dit tijdslot</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, timeSlot.enabled && styles.toggleOn]}
              onPress={() => setTimeSlot(p => ({ ...p, enabled: !p.enabled }))}>
              <View style={[styles.toggleThumb, timeSlot.enabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>

          {timeSlot.enabled && (
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <TimeWheelPicker
                  label="Van"
                  value={{ h: timeSlot.startHour, m: timeSlot.startMinute }}
                  onChange={(h, m) => setTimeSlot(p => ({ ...p, startHour: h, startMinute: m }))}
                />
              </View>
              <Text style={styles.timeSeparator}>–</Text>
              <View style={{ flex: 1 }}>
                <TimeWheelPicker
                  label="Tot"
                  value={{ h: timeSlot.endHour, m: timeSlot.endMinute }}
                  onChange={(h, m) => setTimeSlot(p => ({ ...p, endHour: h, endMinute: m }))}
                />
              </View>
            </View>
          )}
        </View>

        {/* Theme */}
        <Text style={styles.sectionHeader}>Willekeurig thema</Text>
        <View style={styles.card}>
          <Text style={styles.cardHint}>
            Kies een thema voor de "Verras me!" knop. De app zoekt dan een willekeurige video in dit thema.
          </Text>
          <View style={styles.themeGrid}>
            {THEMES.map(t => (
              <TouchableOpacity
                key={t.keyword}
                style={[styles.themeChip, themeKeyword === t.keyword && styles.themeChipActive]}
                onPress={() => setThemeKeyword(themeKeyword === t.keyword ? undefined : t.keyword)}>
                <Text style={styles.themeEmoji}>{t.emoji}</Text>
                <Text style={[styles.themeLabel, themeKeyword === t.keyword && styles.themeLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data */}
        <Text style={styles.sectionHeader}>Gegevens</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={() => navigation.navigate('WatchHistory', { folderId })}>
            <Tv size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.dangerLabel}>Kijkgeschiedenis bekijken</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearHistory}>
            <Text style={[styles.dangerLabel, { color: COLORS.error }]}>Kijkgeschiedenis wissen</Text>
            <ChevronRight size={16} color={COLORS.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerRow, styles.dangerRowLast]}
            onPress={() =>
              Alert.alert(
                `${folder.name} verwijderen?`,
                'Dit verwijdert het profiel en alle bijbehorende data.',
                [
                  { text: 'Annuleer', style: 'cancel' },
                  {
                    text: 'Verwijder',
                    style: 'destructive',
                    onPress: async () => {
                      await StorageService.deleteFolder(folderId);
                      navigation.goBack();
                    },
                  },
                ],
              )
            }>
            <Text style={[styles.dangerLabel, { color: COLORS.error }]}>Kind verwijderen</Text>
            <ChevronRight size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>

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
  backBtn: { width: 70, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: FONTS.sizes.md, color: COLORS.primaryLight, fontWeight: '600' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  saveBtn: { width: 70, alignItems: 'flex-end' },
  saveText: { fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: '700' },

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
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },

  // End message
  messageInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
  },

  // Daily limit chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: { color: '#fff' },

  // Time slot
  slotToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotToggleLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  slotToggleSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textMuted,
    marginTop: 28,
    fontWeight: '300',
  },
  timeLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  timePillText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timeDropdown: {
    maxHeight: 180,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timeOptionActive: { backgroundColor: '#EEF2FF' },
  timeOptionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  timeOptionTextActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Themes
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  themeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  themeEmoji: { fontSize: 16 },
  themeLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  themeLabelActive: { color: '#fff' },

  // Data
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dangerRowLast: { borderBottomWidth: 0 },
  dangerLabel: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});
