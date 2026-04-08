import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Folder } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';
import { DonationService } from '../services/DonationService';

// Track whether initial app-open auth has been done this session
let initialAuthDone = false;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LockedHome'>;
};

const CHILD_COLORS = ['#4F7FFF', '#FF6B6B', '#43D19E', '#FF9F43', '#A55EEA', '#26C6DA'];
const FACE_EMOJIS = ['👦', '👧', '👶', '🧒', '🧑', '👱', '👦🏽', '👧🏽', '👦🏿', '👧🏿', '🧒🏽', '🐣'];

export function LockedHomeScreen({ navigation }: Props) {
  const [children, setChildren] = useState<Folder[]>([]);
  const [showNewChild, setShowNewChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildEmoji, setNewChildEmoji] = useState('👦');

  useEffect(() => {
    if (!initialAuthDone) {
      initialAuthDone = true;
      navigation.navigate('ParentAuth', { returnTo: 'LockedHome' });
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
    const showDonation = await DonationService.shouldShowPrompt();
    if (showDonation) {
      navigation.navigate('DonationPrompt');
    }
  };

  const loadChildren = async () => {
    const f = await StorageService.getFolders();
    setChildren(f.filter(folder => folder.videos.length > 0));
  };

  const handleChildPress = (child: Folder) => {
    navigation.navigate('FolderVideos', { folderId: child.id });
  };

  const handleSearch = () => {
    navigation.navigate('ParentAuth', { returnTo: 'Search' });
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

  const renderChild = ({ item, index }: { item: Folder; index: number }) => {
    const color = CHILD_COLORS[index % CHILD_COLORS.length];
    return (
      <TouchableOpacity
        style={[styles.childCard, { backgroundColor: color }]}
        onPress={() => handleChildPress(item)}
        activeOpacity={0.88}>
        <Text style={styles.childEmoji}>{item.emoji}</Text>
        <Text style={styles.childName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.childCount}>
          {item.videos.length} {item.videos.length === 1 ? "video" : "video's"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>▶</Text>
          </View>
          <Text style={styles.appName}>PlayOneVideo</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addChildBtn}
            onPress={() => setShowNewChild(true)}
            activeOpacity={0.85}>
            <Text style={styles.addChildBtnText}>+ Kind</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('ParentAuth', { returnTo: 'Settings' })}
            activeOpacity={0.85}>
            <Text style={styles.settingsBtnIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Children grid or empty state */}
      {children.length > 0 ? (
        <FlatList
          data={children}
          keyExtractor={item => item.id}
          renderItem={renderChild}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.emptyTitle}>Voeg een kind toe</Text>
          <Text style={styles.emptySubtitle}>
            Maak een profiel aan voor elk kind en zoek video's die bij hen passen.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setShowNewChild(true)}>
            <Text style={styles.emptyAddBtnText}>+ Kind toevoegen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Zoek-knop onderaan */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.88}>
          <Text style={styles.searchButtonIcon}>🔍</Text>
          <Text style={styles.searchButtonText}>Video zoeken</Text>
        </TouchableOpacity>
      </View>

      {/* Nieuw kind modal */}
      <Modal
        visible={showNewChild}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChild(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewChild(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalSheet}>
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
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 20, color: '#fff', marginLeft: 2 },
  appName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addChildBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addChildBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  settingsBtnIcon: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },

  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  gridRow: { gap: 12, marginBottom: 12 },
  childCard: {
    flex: 1,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    minHeight: 155,
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  childEmoji: { fontSize: 52 },
  childName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  childCount: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.8)',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 4 },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAddBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  searchButtonIcon: { fontSize: 20 },
  searchButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Modal (slide from bottom)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiOption: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiSelected: { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' },
  emojiOptionText: { fontSize: 26 },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalCreate: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalCreateText: {
    fontSize: FONTS.sizes.md,
    color: '#fff',
    fontWeight: '700',
  },
});
