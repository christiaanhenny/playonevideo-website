import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
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
      mode: 'full',
    };
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
        <View style={[styles.thumbnail, { backgroundColor: COLORS.border }]} />
      )}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {decodeHtml(item.title)}
        </Text>
        <Text style={styles.channelName} numberOfLines={1}>{item.channelName}</Text>
        {item.duration && <Text style={styles.duration}>{item.duration}</Text>}
      </View>
      <View style={styles.playArrow}>
        <Text style={styles.playArrowText}>▶</Text>
      </View>
    </TouchableOpacity>
  );

  if (!folder) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleAddVideo} activeOpacity={0.7}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.folderIconWrap}>
          <Text style={styles.folderEmoji}>{folder.emoji}</Text>
        </View>
        <Text style={styles.folderName}>{folder.name}</Text>
        <Text style={styles.videoCount}>
          {folder.videos.length} {folder.videos.length === 1 ? 'video' : 'video\'s'}
        </Text>
      </View>

      <FlatList
        data={folder.videos}
        keyExtractor={item => item.id}
        renderItem={renderVideo}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Geen video's in deze map</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  iconButton: {
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
  addButtonText: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 26,
  },
  folderIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  folderEmoji: { fontSize: 40 },
  folderName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  videoCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  list: { padding: 16, gap: 12 },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnail: {
    width: 110,
    height: 72,
    backgroundColor: COLORS.border,
  },
  videoInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  videoTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  channelName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.accent,
    fontWeight: '500',
  },
  duration: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  playArrow: {
    paddingRight: 14,
    paddingLeft: 4,
  },
  playArrowText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
  },
});
