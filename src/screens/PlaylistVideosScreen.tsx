import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
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
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlaylistVideos'>;
  route: RouteProp<RootStackParamList, 'PlaylistVideos'>;
};

export function PlaylistVideosScreen({ navigation, route }: Props) {
  const { playlistId, title } = route.params;
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    YouTubeService.fetchPlaylistItems(playlistId)
      .then(setVideos)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [playlistId]);

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
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 70 }} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Kon playlist niet laden.</Text>
        </View>
      )}

      {!loading && !error && videos.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Geen videos gevonden in deze playlist.</Text>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FONTS.sizes.md, color: COLORS.textMuted },
  list: { paddingBottom: 24 },
});
