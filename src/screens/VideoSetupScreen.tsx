import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Chapter, PlaybackConfig, PlaybackSegment, Folder } from '../types';
import { COLORS, FONTS } from '../constants';
import { YouTubeService } from '../services/YouTubeService';
import { parseChaptersFromDescription } from '../services/ChapterParser';
import { StorageService } from '../services/StorageService';
import { useAppState } from '../context/AppStateContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VideoSetup'>;
  route: RouteProp<RootStackParamList, 'VideoSetup'>;
};

type PlayMode = 'full' | 'first_chapter' | 'custom';

export function VideoSetupScreen({ navigation, route }: Props) {
  const { video } = route.params;
  const { relock, resetUnlockTimer } = useAppState();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [playMode, setPlayMode] = useState<PlayMode>('full');
  const [loading, setLoading] = useState(true);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(
    video.durationSeconds ?? 0,
  );
  const [isFavourite, setIsFavourite] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    loadDetails();
    checkFavourite();
  }, []);

  const openFolderModal = async () => {
    const f = await StorageService.getFolders();
    setFolders(f);
    setNewFolderName('');
    setCreatingFolder(false);
    setShowFolderModal(true);
  };

  const handleAddToFolder = async (folder: Folder) => {
    await StorageService.addVideoToFolder(folder.id, video);
    setShowFolderModal(false);
    Alert.alert('Toegevoegd', `"${video.title}" staat nu in "${folder.name}".`);
  };

  const handleCreateAndAdd = async () => {
    if (!newFolderName.trim()) return;
    const folder = await StorageService.createFolder(newFolderName.trim(), '📁');
    await StorageService.addVideoToFolder(folder.id, video);
    setShowFolderModal(false);
    Alert.alert('Toegevoegd', `Map "${folder.name}" aangemaakt met deze video.`);
  };

  const loadDetails = async () => {
    setLoading(true);
    try {
      const details = await YouTubeService.fetchVideoDetails(video.id);
      if (details) {
        const dur = details.durationSeconds;
        setTotalDurationSeconds(dur);
        const parsed = parseChaptersFromDescription(details.description, dur);
        setChapters(parsed);
        if (parsed.length > 0) {
          setSelectedChapters(new Set(parsed.map(c => c.index)));
        }
      }
    } catch {
      // Fallback: full video only
    } finally {
      setLoading(false);
    }
  };

  const checkFavourite = async () => {
    const favs = await StorageService.getFavourites();
    setIsFavourite(favs.some(f => f.id === video.id));
  };

  const toggleFavourite = async () => {
    if (isFavourite) {
      await StorageService.removeFavourite(video.id);
      setIsFavourite(false);
    } else {
      await StorageService.addFavourite(video);
      setIsFavourite(true);
    }
    resetUnlockTimer();
  };

  const toggleChapter = (index: number) => {
    const next = new Set(selectedChapters);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedChapters(next);
    resetUnlockTimer();
  };

  const buildSegments = (): PlaybackSegment[] => {
    if (playMode === 'full' || chapters.length === 0) {
      return [{ startSeconds: 0, endSeconds: totalDurationSeconds }];
    }
    if (playMode === 'first_chapter') {
      const first = chapters[0];
      return [{ startSeconds: first.startSeconds, endSeconds: first.endSeconds }];
    }
    const selected = chapters
      .filter(c => selectedChapters.has(c.index))
      .sort((a, b) => a.startSeconds - b.startSeconds);
    if (selected.length === 0) return [{ startSeconds: 0, endSeconds: totalDurationSeconds }];
    return selected.map(c => ({ startSeconds: c.startSeconds, endSeconds: c.endSeconds }));
  };

  const handleStart = () => {
    if (playMode === 'custom' && selectedChapters.size === 0) return;
    const config: PlaybackConfig = {
      video,
      segments: buildSegments(),
      mode: playMode,
    };
    relock();
    navigation.navigate('Playback', { config });
  };

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const selectedDuration = (): number => {
    if (playMode === 'full') return totalDurationSeconds;
    if (playMode === 'first_chapter' && chapters.length > 0) {
      return chapters[0].endSeconds - chapters[0].startSeconds;
    }
    if (playMode === 'custom') {
      return chapters
        .filter(c => selectedChapters.has(c.index))
        .reduce((sum, c) => sum + (c.endSeconds - c.startSeconds), 0);
    }
    return totalDurationSeconds;
  };

  const canStart = playMode !== 'custom' || selectedChapters.size > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Video Setup</Text>
          <TouchableOpacity style={styles.favButton} onPress={toggleFavourite}>
            <Text style={styles.favIcon}>{isFavourite ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>

        {/* Thumbnail */}
        <View style={styles.thumbnailWrap}>
          {video.thumbnail ? (
            <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text style={styles.thumbnailPlaceholderIcon}>▶</Text>
            </View>
          )}
        </View>

        {/* Video info */}
        <View style={styles.infoBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title
              .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.channel}>{video.channelName}</Text>
            {totalDurationSeconds > 0 && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.duration}>{formatSeconds(totalDurationSeconds)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Playback mode — only shown when video has chapters */}
        {!loading && chapters.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to play</Text>

          <TouchableOpacity
            style={[styles.modeRow, playMode === 'full' && styles.modeRowActive]}
            onPress={() => { setPlayMode('full'); resetUnlockTimer(); }}
            activeOpacity={0.7}>
            <View style={[styles.radio, playMode === 'full' && styles.radioActive]}>
              {playMode === 'full' && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modeLabel, playMode === 'full' && styles.modeLabelActive]}>
                Full video
              </Text>
              {totalDurationSeconds > 0 && (
                <Text style={styles.modeSub}>{formatSeconds(totalDurationSeconds)}</Text>
              )}
            </View>
          </TouchableOpacity>

          {chapters.length > 0 && (
            <TouchableOpacity
              style={[styles.modeRow, playMode === 'first_chapter' && styles.modeRowActive]}
              onPress={() => { setPlayMode('first_chapter'); resetUnlockTimer(); }}
              activeOpacity={0.7}>
              <View style={[styles.radio, playMode === 'first_chapter' && styles.radioActive]}>
                {playMode === 'first_chapter' && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeLabel, playMode === 'first_chapter' && styles.modeLabelActive]}>
                  First chapter only
                </Text>
                <Text style={styles.modeSub}>
                  {chapters[0].title} · {formatSeconds(chapters[0].endSeconds - chapters[0].startSeconds)}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {chapters.length > 1 && (
            <TouchableOpacity
              style={[styles.modeRow, playMode === 'custom' && styles.modeRowActive]}
              onPress={() => { setPlayMode('custom'); resetUnlockTimer(); }}
              activeOpacity={0.7}>
              <View style={[styles.radio, playMode === 'custom' && styles.radioActive]}>
                {playMode === 'custom' && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.modeLabel, playMode === 'custom' && styles.modeLabelActive]}>
                Select chapters
              </Text>
            </TouchableOpacity>
          )}
        </View>
        )}

        {/* Chapter list (custom mode) */}
        {playMode === 'custom' && chapters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ paddingVertical: 12 }} />
            ) : (
              chapters.map((chapter, idx) => (
                <TouchableOpacity
                  key={chapter.index}
                  style={[
                    styles.chapterRow,
                    idx === chapters.length - 1 && styles.chapterRowLast,
                  ]}
                  onPress={() => toggleChapter(chapter.index)}
                  activeOpacity={0.7}>
                  <View style={[styles.checkbox, selectedChapters.has(chapter.index) && styles.checkboxChecked]}>
                    {selectedChapters.has(chapter.index) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterTimes}>
                      {formatSeconds(chapter.startSeconds)} – {formatSeconds(chapter.endSeconds)}
                      {' · '}{formatSeconds(chapter.endSeconds - chapter.startSeconds)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Duration summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryTime}>{formatSeconds(selectedDuration())}</Text>
        </View>

        {/* Add to folder */}
        <TouchableOpacity
          style={styles.folderButton}
          onPress={openFolderModal}
          activeOpacity={0.8}>
          <Text style={styles.folderButtonText}>📁  Voeg toe aan map</Text>
        </TouchableOpacity>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.88}>
          <Text style={styles.startButtonText}>
            {canStart ? 'Start Video' : 'Select at least one chapter'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Folder picker modal */}
      <Modal
        visible={showFolderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFolderModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Voeg toe aan map</Text>

            {folders.map(folder => (
              <TouchableOpacity
                key={folder.id}
                style={styles.folderOption}
                onPress={() => handleAddToFolder(folder)}>
                <Text style={styles.folderOptionEmoji}>{folder.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.folderOptionName}>{folder.name}</Text>
                  <Text style={styles.folderOptionCount}>{folder.videos.length} video's</Text>
                </View>
                <Text style={styles.folderOptionArrow}>›</Text>
              </TouchableOpacity>
            ))}

            {creatingFolder ? (
              <View style={styles.newFolderRow}>
                <TextInput
                  style={styles.newFolderInput}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Naam van de map"
                  placeholderTextColor={COLORS.textMuted}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.newFolderSave, !newFolderName.trim() && { opacity: 0.4 }]}
                  onPress={handleCreateAndAdd}
                  disabled={!newFolderName.trim()}>
                  <Text style={styles.newFolderSaveText}>Maak</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.newFolderBtn}
                onPress={() => setCreatingFolder(true)}>
                <Text style={styles.newFolderBtnText}>+ Nieuwe map aanmaken</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowFolderModal(false)}>
              <Text style={styles.modalCancelText}>Annuleer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 48 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 26,
    color: COLORS.textSecondary,
    lineHeight: 30,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  favButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favIcon: { fontSize: 24, color: COLORS.accent },
  thumbnailWrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  thumbnail: {
    width: '100%',
    height: 210,
  },
  thumbnailPlaceholder: {
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderIcon: {
    fontSize: 48,
    color: COLORS.textMuted,
  },
  infoBlock: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 4,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  duration: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  modeRowActive: {
    backgroundColor: '#EEF2FF',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  modeLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  modeLabelActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  modeSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chapterRowLast: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  chapterTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  chapterTimes: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryBox: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  summaryTime: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  startButton: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  folderButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  folderButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  folderOptionEmoji: { fontSize: 24 },
  folderOptionName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  folderOptionCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  folderOptionArrow: {
    fontSize: 22,
    color: COLORS.textMuted,
  },
  newFolderBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  newFolderBtnText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.accent,
    fontWeight: '600',
  },
  newFolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  newFolderInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  newFolderSave: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  newFolderSaveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
  },
});
