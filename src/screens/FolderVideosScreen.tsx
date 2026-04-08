import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Dimensions} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Folder, VideoResult, PlaybackConfig } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FolderVideos'>;
  route: RouteProp<RootStackParamList, 'FolderVideos'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
const THUMB_HEIGHT = Math.round(CARD_WIDTH * 9 / 16);

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function FolderVideosScreen({ navigation, route }: Props) {
  const { folderId } = route.params;
  const [folder, setFolder] = useState<Folder | null>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddVideo = () => {
    navigation.navigate('ParentAuth', { returnTo: 'Search' });
  };

  useFocusEffect(
    useCallback(() => {
      loadFolder();
    }, [folderId]),
  );

  const loadFolder = async () => {
    const folders = await StorageService.getFolders();
    const found = folders.find(f => f.id === folderId) ?? null;
    setFolder(found);
  };

  const handleVideoPress = (video: VideoResult) => {
    const config: PlaybackConfig = {
      video,
      segments: [{ startSeconds: 0, endSeconds: video.durationSeconds ?? 7200 }],
      mode: 'full'};
    navigation.replace('Playback', { config });
  };

  const renderVideo = ({ item }: { item: VideoResult }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => handleVideoPress(item)}
      activeOpacity={0.85}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.thumbnailPlaceholderIcon}>▶</Text>
        </View>
      )}
      <View style={styles.playOverlay}>
        <View style={styles.playCircle}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {decodeHtml(item.title)}
        </Text>
        {item.duration && (
          <Text style={styles.duration}>{item.duration}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!folder) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.folderEmoji}>{folder.emoji}</Text>
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.videoCount}>
            {folder.videos.length} {folder.videos.length === 1 ? 'video' : "video's"}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleAddVideo} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={folder.videos}
        keyExtractor={item => item.id}
        renderItem={renderVideo}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎬</Text>
            <Text style={styles.emptyText}>Nog geen video's in deze map</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddVideo}>
              <Text style={styles.emptyButtonText}>Video toevoegen</Text>
            </TouchableOpacity>
          </View>
        }
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
    borderBottomColor: COLORS.border},
  iconButton: {
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
  backButtonText: {
    fontSize: 26,
    color: COLORS.textSecondary,
    lineHeight: 30},
  addButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 28},
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2},
  folderEmoji: { fontSize: 28 },
  folderName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3},
  videoCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted},

  grid: {
    padding: CARD_PADDING,
    paddingBottom: 32},
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP},
  videoCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3},
  thumbnail: {
    width: CARD_WIDTH,
    height: THUMB_HEIGHT,
    backgroundColor: COLORS.border},
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center'},
  thumbnailPlaceholderIcon: {
    fontSize: 28,
    color: COLORS.textMuted},
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: THUMB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center'},
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center'},
  playIcon: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 2},
  videoInfo: {
    padding: 10,
    gap: 4},
  videoTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18},
  duration: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted},

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12},
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    textAlign: 'center'},
  emptyButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14},
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sizes.md}});
