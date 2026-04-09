import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions} from 'react-native';
import { ChevronLeft, Settings, Search, X, Clock, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { RootStackParamList, VideoResult } from '../types';
import { COLORS, FONTS, YOUTUBE_API_KEY } from '../constants';
import { YouTubeService } from '../services/YouTubeService';
import { StorageService } from '../services/StorageService';
import { SearchResultCard } from '../components/SearchResultCard';
import { useAppState } from '../context/AppStateContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
  route: RouteProp<RootStackParamList, 'Search'>;
};

type Tab = 'videos' | 'playlists' | 'channels';

export function SearchScreen({ navigation, route }: Props) {
  const { isParentUnlocked, relock, resetUnlockTimer } = useAppState();
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;
  const isFocused = useIsFocused();
  const themeKeyword = route?.params?.themeKeyword;
  const isThemeMode = !!themeKeyword;
  const [query, setQuery] = useState(themeKeyword ?? '');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('videos');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favourites, setFavourites] = useState<VideoResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const noApiKey = YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY';

  useEffect(() => {
    loadInitialData();
    // Auto-search if a theme keyword was passed
    if (themeKeyword) {
      performSearch(themeKeyword, 'videos');
    }
  }, []);

  useEffect(() => {
    if (!isParentUnlocked && isFocused) {
      navigation.replace('LockedHome');
    }
  }, [isParentUnlocked, isFocused, navigation]);

  const loadInitialData = async () => {
    const [searches, favs] = await Promise.all([
      StorageService.getRecentSearches(),
      StorageService.getFavourites(),
    ]);
    setRecentSearches(searches);
    setFavourites(favs);
  };

  const performSearch = async (searchQuery: string, searchTab: Tab) => {
    if (!searchQuery.trim()) return;
    resetUnlockTimer();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      if (noApiKey) {
        setResults(getMockResults());
      } else if (searchTab === 'channels') {
        const data = await YouTubeService.searchChannels(searchQuery);
        setResults(data);
      } else {
        const type = searchTab === 'playlists' ? 'playlist' : 'video';
        const data = await YouTubeService.search(searchQuery, type);
        setResults(data);
      }
      await StorageService.addRecentSearch(searchQuery);
      const searches = await StorageService.getRecentSearches();
      setRecentSearches(searches);
    } catch {
      setError('Zoeken mislukt. Controleer je internetverbinding.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (query.trim() && hasSearched) {
      performSearch(query, newTab);
    }
  };

  const handleResultPress = (video: VideoResult) => {
    resetUnlockTimer();
    if (video.type === 'channel') {
      navigation.navigate('ChannelVideos', {
        channelId: video.channelId ?? video.id,
        title: video.title,
        thumbnail: video.thumbnail,
      });
    } else if (video.type === 'playlist') {
      navigation.navigate('PlaylistVideos', { playlistId: video.id, title: video.title });
    } else {
      navigation.navigate('VideoSetup', { video });
    }
  };

  const handleSettingsPress = () => {
    resetUnlockTimer();
    navigation.navigate('Settings');
  };

  const renderEmpty = () => {
    if (loading) return null;
    if (hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Search size={40} color={COLORS.textMuted} style={{ marginBottom: 4 }} />
          <Text style={styles.emptyTitle}>Geen resultaten</Text>
          <Text style={styles.emptySubtitle}>Probeer een andere zoekterm</Text>
        </View>
      );
    }
    return (
      <View style={styles.suggestions}>
        {recentSearches.length > 0 && (
          <View style={styles.suggestionSection}>
            <Text style={styles.sectionTitle}>Recent gezocht</Text>
            <View style={styles.sectionCard}>
              {recentSearches.map((s, idx) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.recentItem,
                    idx === recentSearches.length - 1 && styles.recentItemLast,
                  ]}
                  onPress={() => {
                    setQuery(s);
                    performSearch(s, tab);
                  }}
                >
                  <Clock size={14} color={COLORS.textMuted} />
                  <Text style={styles.recentText}>{s}</Text>
                  <ChevronRight size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {favourites.length > 0 && (
          <View style={[styles.suggestionSection, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Favorieten</Text>
            {favourites.map(f => (
              <SearchResultCard key={f.id} item={f} onPress={handleResultPress} />
            ))}
          </View>
        )}
        {noApiKey && (
          <View style={styles.apiKeyWarning}>
            <Settings size={32} color={COLORS.accent} style={{ marginBottom: 8 }} />
            <Text style={styles.apiKeyWarningTitle}>Demo Mode</Text>
            <Text style={styles.apiKeyWarningText}>
              Add your YouTube Data API key in{'\n'}
              src/constants/index.ts to enable real search.
            </Text>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => performSearch('demo', tab)}>
              <Text style={styles.demoButtonText}>Load Demo Results</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={[{ flex: 1 }, isIPad && { maxWidth: 640, alignSelf: 'center', width: '100%' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { relock(); navigation.navigate('LockedHome'); }}
            style={styles.headerIconBtn}>
            <View style={styles.headerIconWrap}>
              <ChevronLeft size={22} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kies een video</Text>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.headerIconBtn}>
            <View style={styles.headerIconWrap}>
              <Settings size={18} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SearchResultCard item={item} onPress={handleResultPress} />
          )}
          ListHeaderComponent={() => (
            <>
              {/* Theme mode banner */}
              {isThemeMode && (
                <View style={styles.themeBanner}>
                  <Text style={styles.themeBannerText}>🎲 Willekeurig thema: zoekresultaten voor "{themeKeyword}"</Text>
                </View>
              )}

              {/* Search bar */}
              <View style={styles.searchRow}>
                <View style={styles.searchBar}>
                  <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Zoek op YouTube..."
                    placeholderTextColor={COLORS.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={() => performSearch(query, tab)}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
                      <X size={12} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.tabsRow}>
                <View style={styles.tabsContainer}>
                  {(['videos', 'playlists', 'channels'] as Tab[]).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tab, tab === t && styles.tabActive]}
                      onPress={() => handleTabChange(t)}>
                      <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                        {t === 'videos' ? "Video's" : t === 'playlists' ? 'Afspeellijsten' : 'Kanalen'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              )}

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Zoeken...</Text>
                </View>
              )}
            </>
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getMockResults(): VideoResult[] {
  return [
    {
      id: 'dQw4w9WgXcQ',
      type: 'video',
      title: 'Example Educational Video for Kids',
      channelName: 'Learning Channel',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      duration: '3:33',
      durationSeconds: 213,
      description: 'A great educational video for children.'},
    {
      id: 'M7lc1UVf-VE',
      type: 'video',
      title: 'Nature Documentary: Amazing Animals',
      channelName: 'Nature Channel',
      thumbnail: 'https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg',
      duration: '10:22',
      durationSeconds: 622,
      description: 'Learn about animals in their natural habitat.'},
    {
      id: 'jNQXAC9IVRw',
      type: 'video',
      title: 'Me at the zoo — First YouTube video',
      channelName: 'jawed',
      thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg',
      duration: '0:19',
      durationSeconds: 19,
      description: 'The first YouTube video ever uploaded.'},
  ];
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3},
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 10},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '400'},
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center'},
  tabsRow: {
    paddingHorizontal: 16,
    paddingBottom: 10},
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: 22,
    padding: 3,
    alignSelf: 'flex-start'},
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20},
  tabActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2},
  tabText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500'},
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700'},
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12},
  loadingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted},
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10},
  errorText: { color: COLORS.error, fontSize: FONTS.sizes.sm, fontWeight: '500' },
  list: { paddingBottom: 24, flexGrow: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8},
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary},
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary},
  suggestions: { paddingBottom: 24, flexGrow: 1 },
  suggestionSection: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10},
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1},
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10},
  recentItemLast: {
    borderBottomWidth: 0},
  recentText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '400'},
  themeBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  themeBannerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  apiKeyWarning: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2},
  apiKeyWarningTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6},
  apiKeyWarningText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20},
  demoButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12},
  demoButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sizes.sm}});
