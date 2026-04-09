import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, WatchHistoryEntry, Folder } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';
import { ChevronLeft, Tv } from 'lucide-react-native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WatchHistory'>;
  route: RouteProp<RootStackParamList, 'WatchHistory'>;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Vandaag ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  if (isYesterday) {
    return `Gisteren ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) +
    ` ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function WatchHistoryScreen({ navigation, route }: Props) {
  const { folderId } = route.params;
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [folderId]),
  );

  const load = async () => {
    const [h, folders] = await Promise.all([
      StorageService.getWatchHistory(folderId),
      StorageService.getFolders(),
    ]);
    setHistory(h);
    setFolder(folders.find(f => f.id === folderId) ?? null);
  };

  const handleClear = () => {
    Alert.alert(
      'Geschiedenis wissen',
      `Wis alle kijkgeschiedenis van ${folder?.name ?? 'dit kind'}?`,
      [
        { text: 'Annuleer', style: 'cancel' },
        {
          text: 'Wissen',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearWatchHistory(folderId);
            setHistory([]);
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: WatchHistoryEntry }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardMeta}>
          {formatDate(item.watchedAt)}
          {item.durationSeconds > 0 ? `  ·  ${formatDuration(item.durationSeconds)}` : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={18} color={COLORS.primaryLight} />
          <Text style={styles.backText}>Terug</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {folder ? `${folder.emoji} ${folder.name}` : 'Geschiedenis'}
        </Text>
        {history.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Wis</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Tv size={52} color={COLORS.textMuted} style={{ marginBottom: 4 }} />
          <Text style={styles.emptyTitle}>Nog geen video's gekeken</Text>
          <Text style={styles.emptySubtitle}>
            Elke gekeken video verschijnt hier.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.totalLabel}>
              {history.length} video{history.length !== 1 ? "'s" : ''} bekeken
            </Text>
          }
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
    backgroundColor: COLORS.background,
  },
  backBtn: { width: 70, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  clearBtn: { width: 50, alignItems: 'flex-end' },
  clearText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
    fontWeight: '600',
  },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  totalLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  thumb: {
    width: 112,
    height: 72,
  },
  cardInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 4,
  },
  cardTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  cardMeta: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
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
});
