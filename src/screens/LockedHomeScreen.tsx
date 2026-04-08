import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Folder } from '../types';
import { COLORS, FONTS } from '../constants';
import { StorageService } from '../services/StorageService';
import { DonationService } from '../services/DonationService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LockedHome'>;
};

const FOLDER_COLORS = ['#4F7FFF', '#FF6B6B', '#43D19E', '#FF9F43', '#A55EEA', '#26C6DA'];

export function LockedHomeScreen({ navigation }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
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
    setFolders(f.filter(folder => folder.videos.length > 0));
  };

  const handleFolderPress = (folder: Folder) => {
    navigation.navigate('FolderVideos', { folderId: folder.id });
  };

  const handleSearch = () => {
    navigation.navigate('ParentAuth', { returnTo: 'Search' });
  };

  const renderFolder = ({ item, index }: { item: Folder; index: number }) => {
    const color = FOLDER_COLORS[index % FOLDER_COLORS.length];
    return (
      <TouchableOpacity
        style={[styles.folderCard, { backgroundColor: color }]}
        onPress={() => handleFolderPress(item)}
        activeOpacity={0.88}>
        <Text style={styles.folderCardEmoji}>{item.emoji}</Text>
        <Text style={styles.folderCardName}>{item.name}</Text>
        <Text style={styles.folderCardCount}>
          {item.videos.length} {item.videos.length === 1 ? 'video' : "video's"}
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
          <Text style={styles.emptyTitle}>Nog geen mappen</Text>
          <Text style={styles.emptySubtitle}>
            Zoek een video en voeg hem toe aan een map.
          </Text>
        </View>
      )}

      {/* Search button — always visible, requires parent auth */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.88}>
          <Text style={styles.searchButtonIcon}>🔍</Text>
          <Text style={styles.searchButtonText}>Video zoeken</Text>
        </TouchableOpacity>
      </View>
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 16, color: '#fff', marginLeft: 2 },
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
    minHeight: 140,
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  folderCardEmoji: { fontSize: 40 },
  folderCardName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  folderCardCount: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.75)',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
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
    paddingBottom: 24,
    paddingTop: 12,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  searchButtonIcon: { fontSize: 18 },
  searchButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
