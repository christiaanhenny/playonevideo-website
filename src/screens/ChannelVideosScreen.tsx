import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, VideoResult } from '../types';
import { COLORS, FONTS } from '../constants';
import { YouTubeService } from '../services/YouTubeService';
import { SearchResultCard } from '../components/SearchResultCard';
import { ChevronLeft } from 'lucide-react-native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChannelVideos'>;
  route: RouteProp<RootStackParamList, 'ChannelVideos'>;
};

export function ChannelVideosScreen({ navigation, route }: Props) {
  const { channelId, title, thumbnail } = route.params;
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [channelId]);

  const loadVideos = async () => {
    try {
      const uploadsPlaylistId = await YouTubeService.fetchChannelUploadsPlaylistId(channelId);
      if (!uploadsPlaylistId) {
        setError(true);
        return;
      }
      const items = await YouTubeService.fetchPlaylistItems(uploadsPlaylistId);
      setVideos(items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPress = (video: VideoResult) => {
    navigation.navigate('VideoSetup', { video });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={18} color={COLORS.primary} />
          <Text style={styles.backText}>Terug</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.headerAvatar} />
          ) : null}
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Video's laden...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Kon video's van dit kanaal niet laden.</Text>
        </View>
      )}

      {!loading && !error && videos.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Geen insluitbare video's gevonden.</Text>
        </View>
      )}

      {!loading && !error && videos.length > 0 && (
        <FlatList
          data={videos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SearchResultCard item={item} onPress={handleVideoPress} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  backBtn: { width: 70, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: '500' },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  errorText: { fontSize: FONTS.sizes.md, color: COLORS.textMuted },
  list: { paddingBottom: 24, paddingTop: 8 },
});
