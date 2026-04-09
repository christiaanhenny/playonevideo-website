import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Lock, Search, Shuffle } from 'lucide-react-native';
import { AppLogo } from '../components/AppLogo';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Folder, TimeSlot } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';
import { useAppState } from '../context/AppStateContext';
import { useParentAuth } from '../hooks/useParentAuth';
import { EmptyChildrenIllustration } from '../components/EmptyChildrenIllustration';

// Track whether initial app-open auth has been done this session
let initialAuthDone = false;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LockedHome'>;
};

const FACE_EMOJIS = ['👦', '👧', '👶', '🧒', '🧑', '👱', '👦🏽', '👧🏽', '👦🏿', '👧🏿', '🧒🏽', '🐣'];

function isWithinTimeSlot(slot: TimeSlot): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = slot.startHour * 60 + slot.startMinute;
  const endMinutes = slot.endHour * 60 + slot.endMinute;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function formatTime(h: number, m: number): string {
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function LockedHomeScreen({ navigation }: Props) {
  const { setActiveChildId } = useAppState();
  const { navigateWithAuth } = useParentAuth();
  const [children, setChildren] = useState<Folder[]>([]);
  const [showNewChild, setShowNewChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildEmoji, setNewChildEmoji] = useState('👦');

  const { width } = useWindowDimensions();
  const isIPad = width >= 768;
  const gridColumns = isIPad ? 3 : 2;

  useEffect(() => {
    if (!initialAuthDone) {
      initialAuthDone = true;
      navigateWithAuth('LockedHome');
    }
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, []),
  );

  const init = async () => {
    await StorageService.incrementAppOpenCount();
  };

  const loadChildren = async () => {
    const f = await StorageService.getFolders();
    setChildren(f);
  };

  const handleChildPress = (child: Folder) => {
    // Check time slot
    if (child.timeSlot?.enabled && !isWithinTimeSlot(child.timeSlot)) {
      return; // Card is visually locked, tap does nothing
    }
    setActiveChildId(child.id);
    navigation.navigate('FolderVideos', { folderId: child.id });
  };

  const handleSearch = () => {
    navigateWithAuth('Search');
  };

  const handleSurpriseMe = (child: Folder) => {
    if (!child.themeKeyword) return;
    navigateWithAuth('Search', { themeKeyword: child.themeKeyword });
  };

  const handleCreateChild = async () => {
    const name = newChildName.trim();
    if (!name) return;
    await StorageService.createFolder(name, newChildEmoji);
    setShowNewChild(false);
    setNewChildName('');
    setNewChildEmoji('👦');
    loadChildren();
  };

  const renderChild = ({ item }: { item: Folder; index: number }) => {
    const slotLocked = item.timeSlot?.enabled && !isWithinTimeSlot(item.timeSlot);

    return (
      <TouchableOpacity
        style={[styles.childCard, slotLocked && styles.childCardLocked]}
        onPress={() => handleChildPress(item)}
        activeOpacity={slotLocked ? 1 : 0.88}>
        {slotLocked && (
          <View style={styles.lockBadge}>
            <Lock size={14} color={COLORS.textMuted} />
          </View>
        )}
        <Text style={[styles.childEmoji, slotLocked && { opacity: 0.4 }]}>{item.emoji}</Text>
        <Text style={[styles.childName, slotLocked && { opacity: 0.4 }]} numberOfLines={1}>
          {item.name}
        </Text>
        {slotLocked ? (
          <Text style={styles.slotLockedText}>
            {`Vanaf ${formatTime(item.timeSlot!.startHour, item.timeSlot!.startMinute)}`}
          </Text>
        ) : (
          <Text style={styles.childCount}>
            {item.videos.length === 0 ? "Nog geen video's" : `${item.videos.length} ${item.videos.length === 1 ? 'video' : "video's"}`}
          </Text>
        )}

        {/* Verras me knop */}
        {!slotLocked && item.themeKeyword && (
          <TouchableOpacity
            style={styles.surpriseBtn}
            onPress={() => handleSurpriseMe(item)}
            activeOpacity={0.8}>
            <Shuffle size={11} color={COLORS.textSecondary} />
            <Text style={styles.surpriseBtnText}>Verras me!</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[styles.content, isIPad && styles.contentIPad]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <AppLogo size={36} />
          <Text style={styles.appName}>PlayOneVideo</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigateWithAuth('Settings')}
          activeOpacity={0.85}>
          <View style={styles.headerIconWrap}>
            <Settings size={18} color={COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Zoekbalk */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={handleSearch}
        activeOpacity={0.88}>
        <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <Text style={styles.searchPlaceholder}>Video zoeken op YouTube...</Text>
      </TouchableOpacity>

      {/* Kinderen sectie-header — alleen zichtbaar als er kinderen zijn */}
      {children.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kinderen</Text>
          <TouchableOpacity
            style={styles.addChildBtn}
            onPress={() => setShowNewChild(true)}
            activeOpacity={0.85}>
            <Text style={styles.addChildBtnText}>＋ Kind toevoegen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Children grid or empty state */}
      {children.length > 0 ? (
        <FlatList
          key={String(gridColumns)}
          data={children}
          keyExtractor={item => item.id}
          renderItem={renderChild}
          numColumns={gridColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          showsVerticalScrollIndicator={false}>
          <EmptyChildrenIllustration size={180} />
          <Text style={styles.emptyTitle}>Voeg een kind toe</Text>
          <Text style={styles.emptySubtitle}>
            Maak een profiel aan voor elk kind en zoek video's die bij hen passen.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setShowNewChild(true)}>
            <Text style={styles.emptyAddBtnText}>+ Kind toevoegen</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      </View>{/* /content */}

      {/* Nieuw kind modal */}
      <Modal
        visible={showNewChild}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChild(false)}>
        <TouchableOpacity
          style={[styles.modalOverlay, isIPad && styles.modalOverlayIPad]}
          activeOpacity={1}
          onPress={() => setShowNewChild(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalSheet, isIPad && styles.modalSheetIPad]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Kind toevoegen</Text>

              <Text style={styles.modalLabel}>Kies een gezichtje</Text>
              <View style={styles.emojiGrid}>
                {FACE_EMOJIS.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      newChildEmoji === emoji && styles.emojiSelected,
                    ]}
                    onPress={() => setNewChildEmoji(emoji)}>
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Naam van het kind</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="bijv. Emma, Noah, Lotte..."
                placeholderTextColor={COLORS.textMuted}
                value={newChildName}
                onChangeText={setNewChildName}
                maxLength={20}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    setShowNewChild(false);
                    setNewChildName('');
                    setNewChildEmoji('👦');
                  }}>
                  <Text style={styles.modalCancelText}>Annuleer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCreate, !newChildName.trim() && { opacity: 0.4 }]}
                  onPress={handleCreateChild}
                  disabled={!newChildName.trim()}>
                  <Text style={styles.modalCreateText}>Toevoegen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10},
  headerIconBtn: { padding: 4 },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2},
  addIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: '400',
    lineHeight: 24},
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10},
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden'},
  appName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3},

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 12},
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary},
  addChildBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border},
  addChildBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary},

  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16},
  gridRow: { gap: 12, marginBottom: 12 },
  childCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2},
  childCardLocked: {
    opacity: 0.5,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
  },
  childEmoji: { fontSize: 32 },
  childName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center'},
  childCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted},
  slotLockedText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  surpriseBtn: {
    marginTop: 4,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  surpriseBtnText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12},
  emptyEmoji: { fontSize: 64, marginBottom: 4 },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center'},
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22},
  emptyAddBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16},
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sizes.md},

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1},
  searchPlaceholder: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted},

  // Modal (slide from bottom)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'},
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 12},
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 8},
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4},
  modalLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4},
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8},
  emojiOption: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent'},
  emojiSelected: { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' },
  emojiOptionText: { fontSize: 26 },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border},
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center'},
  modalCancelText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '600'},
  modalCreate: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center'},
  modalCreateText: {
    fontSize: FONTS.sizes.md,
    color: '#fff',
    fontWeight: '700'},

  content: { flex: 1 },
  contentIPad: { maxWidth: 640, alignSelf: 'center', width: '100%' },

  modalOverlayIPad: { justifyContent: 'center', alignItems: 'center' },
  modalSheetIPad: {
    borderRadius: 24,
    maxWidth: 520,
    width: '90%',
    alignSelf: 'center',
  },
});
