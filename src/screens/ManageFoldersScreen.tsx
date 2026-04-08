import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Modal,
  Alert,
  ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Folder } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManageFolders'>;
};

const EMOJI_OPTIONS = ['👦', '👧', '👶', '🧒', '🧑', '👱', '👦🏽', '👧🏽', '🧒🏽', '🐣', '⭐', '🦁'];

export function ManageFoldersScreen({ navigation }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('👦');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    const f = await StorageService.getFolders();
    setFolders(f);
  };

  const openCreate = () => {
    setNewName('');
    setNewEmoji('📁');
    setEditingFolder(null);
    setShowCreateModal(true);
  };

  const openEdit = (folder: Folder) => {
    setNewName(folder.name);
    setNewEmoji(folder.emoji);
    setEditingFolder(folder);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!newName.trim()) return;
    if (editingFolder) {
      await StorageService.renameFolder(editingFolder.id, newName.trim(), newEmoji);
    } else {
      await StorageService.createFolder(newName.trim(), newEmoji);
    }
    setShowCreateModal(false);
    loadFolders();
  };

  const handleDelete = (folder: Folder) => {
    Alert.alert(
      `"${folder.name}" verwijderen?`,
      'De map en alle video\'s erin worden verwijderd.',
      [
        { text: 'Annuleer', style: 'cancel' },
        {
          text: 'Verwijder',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteFolder(folder.id);
            loadFolders();
          }},
      ],
    );
  };

  const handleRemoveVideo = async (folderId: string, videoId: string) => {
    await StorageService.removeVideoFromFolder(folderId, videoId);
    loadFolders();
  };

  const renderFolder = ({ item }: { item: Folder }) => (
    <View style={styles.folderCard}>
      <View style={styles.folderHeader}>
        <Text style={styles.folderEmoji}>{item.emoji}</Text>
        <View style={styles.folderMeta}>
          <Text style={styles.folderName}>{item.name}</Text>
          <Text style={styles.folderCount}>
            {item.videos.length} {item.videos.length === 1 ? 'video' : "video's"}
          </Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>Bewerk</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {item.videos.map(video => (
        <View key={video.id} style={styles.videoRow}>
          <Text style={styles.videoTitle} numberOfLines={1}>
            {video.title
            .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')}
          </Text>
          <TouchableOpacity onPress={() => handleRemoveVideo(item.id, video.id)}>
            <Text style={styles.removeVideo}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {item.videos.length === 0 && (
        <Text style={styles.emptyFolder}>Nog geen video's — voeg toe via Zoeken</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Terug</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kinderen beheren</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Nieuw</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={folders}
        keyExtractor={item => item.id}
        renderItem={renderFolder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📁</Text>
            <Text style={styles.emptyTitle}>Nog geen mappen</Text>
            <Text style={styles.emptySubtitle}>
              Maak een map aan en voeg video's toe via de zoekscherm.
            </Text>
            <TouchableOpacity style={styles.createFirstBtn} onPress={openCreate}>
              <Text style={styles.createFirstBtnText}>Maak eerste map</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create / Edit modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {editingFolder ? 'Map bewerken' : 'Nieuwe map'}
            </Text>

            {/* Emoji picker */}
            <Text style={styles.modalLabel}>Kies een icoon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
              {EMOJI_OPTIONS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, newEmoji === e && styles.emojiOptionActive]}
                  onPress={() => setNewEmoji(e)}>
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name input */}
            <Text style={styles.modalLabel}>Naam</Text>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="bijv. Nijntje, Natuur, Muziek"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
              maxLength={30}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelBtnText}>Annuleer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !newName.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!newName.trim()}>
                <Text style={styles.saveBtnText}>Opslaan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border},
  backBtn: { paddingRight: 8 },
  backText: { fontSize: FONTS.sizes.md, color: COLORS.accent, fontWeight: '500' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary},
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10},
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: FONTS.sizes.sm },
  list: { padding: 16, gap: 16 },
  folderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2},
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10},
  folderEmoji: { fontSize: 28 },
  folderMeta: { flex: 1 },
  folderName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary},
  folderCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2},
  editBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8},
  editBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '500' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: FONTS.sizes.md, color: COLORS.error },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8},
  videoTitle: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary},
  removeVideo: { fontSize: FONTS.sizes.sm, color: COLORS.error, padding: 4 },
  emptyFolder: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingTop: 4},
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8},
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24},
  createFirstBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14},
  createFirstBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'},
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40},
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20},
  modalLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10},
  emojiRow: { marginBottom: 20 },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent'},
  emojiOptionActive: { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' },
  emojiOptionText: { fontSize: 24 },
  nameInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 24},
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center'},
  cancelBtnText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center'},
  saveBtnDisabled: { backgroundColor: COLORS.textMuted },
  saveBtnText: { fontSize: FONTS.sizes.md, color: '#fff', fontWeight: '700' }});
