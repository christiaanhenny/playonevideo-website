import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { VideoResult } from '../types';
import { COLORS, FONTS } from '../constants';

interface Props {
  item: VideoResult;
  onPress: (item: VideoResult) => void;
}

export function SearchResultCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.72}>
      <View style={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Text style={styles.placeholderIcon}>▶</Text>
          </View>
        )}
        {item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.typePill}>
          <Text style={[styles.typeText, item.type === 'playlist' && styles.typeTextPlaylist]}>
            {item.type === 'playlist' ? 'Playlist' : 'Video'}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.channel} numberOfLines={1}>{item.channelName}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 128,
    height: 96,
    flexShrink: 0,
  },
  thumbnail: {
    width: 128,
    height: 96,
  },
  thumbnailPlaceholder: {
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'flex-start',
    gap: 4,
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    marginBottom: 2,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  typeTextPlaylist: {
    color: '#7C3AED',
  },
  title: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  channel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
