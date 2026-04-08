import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  ScrollView,
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

const FOLDER_COLORS = ['#4F7FFF', '#FF6B6B', '#43D19E', '#FF9F43', '#A55EEA', '#26C6DA'];
const EMOJI_OPTIONS = ['📁', '⭐', '🎬', '🎵', '🐾', '🌈', '🚀', '🦁', '🌊', '🍕', '🎨', '🏆'];

export function LockedHomeScreen({ navigation }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁');

  useEffect(() => {
    if (!initialAuthDone) {
      initialAuthDone = true;
      navigation.navigate('ParentAuth', { returnTo: 'LockedHome' });
    }
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFolders();
    }, []),
  );

  const init = async () => {
    await StorageService.incrementAppOpenCount();
    const showDonation = await DonationService.shouldShowPrompt();
    if (showDonation) {
      navigation.navigate('DonationPrompt');
    }
  };

  const loadFolders = async () => {
    const f = await StorageService.getFolders();
    // Only show folders that have videos — empty folders are managed via Settings
    setFolders(f.filter(folder => folder.videos.length > 0));
  };

  const handleFolderPress = (folder: Folder) => {
    navigation.navigate('FolderVideos', { folderId: folder.id });
  };

  const handleSearch = () => {
    navigation.navigate('ParentAuth', { returnTo: 'Search' });
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    await StorageService.createFolder(name, newFolderEmoji);
    setShowNewFolder(false);
    setNewFolderName('');
    setNewFolderEmoji('📁');
    loadFolders();
  };

  const renderFolder = ({ item, index }: { item: Folder; index: number }) => {
    const color = FOLDER_COLORS[index % FOLDER_COLORS.length];
    return (
      <TouchableOpacity
        style={[styles.folderCard, { backgroundColor: color }]}
        onPress={() => handleFolderPress(item)}
        activeOpacity={0.88}>
        <Text style={styles.folderCardEmoji}>{item.emoji}</Text>
        <Text style={styles.folderCardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.folderCardCount}>
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
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>▶</Text>
        </View>
        <Text style={styles.appName}>PlayOneVideo</Text>
      </View>

      {/* Folder grid or empty state */}
      {folders.length > 0 ? (
        <FlatList
          data={folders}
          keyExtractor={item => item.id}
          renderItem={renderFolder}
          numColumns={2}
          contentContainerStyle={styles.folderGrid}
          columnWrapperStyle={styles.folderRow}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📂</Text>
          <Text style={styles.emptyTitle}>Nog geen video's</Text>
          <Text style={styles.emptySubtitle}>
            Zoek een video, voeg hem toe aan een map en hij verschijnt hier.
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addFolderButton}
          onPress={() => setShowNewFolder(true)}
          activeOpacity={0.88}>
          <Text style={styles.addFolderIcon}>📁</Text>
          <Text style={styles.addFolderText}>Nieuwe map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.88}>
          <Text style={styles.searchButtonIcon}>🔍</Text>
          <Text style={styles.searchButtonText}>Video zoeken</Text>
        </TouchableOpacity>
      </View>

      {/* New folder modal */}
      <Modal
        visible={showNewFolder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewFolder(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewFolder(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nieuwe map</Text>

              <Text style={styles.modalLabel}>Kies een icoon</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      newFolderEmoji === emoji && styles.emojiSelected,
                    ]}
                    onPress={() => setNewFolderEmoji(emoji)}>
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Naam</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="bijv. Nijntje, Natuur, Muziek"
                placeholderTextColor={COLORS.textMuted}
                value={newFolderName}
                onChangeText={setNewFolderName}
                maxLength={30}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    setShowNewFolder(false);
                    setNewFolderName('');
                    setNewFolderEmoji('📁');
                  }}>
                  <Text style={styles.modalCancelText}>Annuleer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCreate, !newFolderName.trim() && { opacity: 0.4 }]}
                  onPress={handleCreateFolder}
                  disabled={!newFolderName.trim()}>
                  <Text style={styles.modalCreateText}>Maak aan</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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

  folderGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  folderRow: { gap: 12, marginBottom: 12 },
  folderCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minHeight: 148,
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  folderCardEmoji: { fontSize: 42 },
  folderCardName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  folderCardCount: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.8)',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
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

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    gap: 10,
  },
  addFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  addFolderIcon: { fontSize: 16 },
  addFolderText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 24,
    gap: 12,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiSelected: { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' },
  emojiOptionText: { fontSize: 24 },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
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
    paddingVertical: 14,
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
