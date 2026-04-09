import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { VideoResult } from '../types';
import { COLORS, FONTS } from '../constants';
import { Play, Tv } from 'lucide-react-native';

interface Props {
  item: VideoResult;
  onPress: (item: VideoResult) => void;
}

export function SearchResultCard({ item, onPress }: Props) {
  if (item.type === 'channel') {
    return (
      <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.72}>
        <View style={styles.channelAvatarWrap}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.channelAvatar} />
          ) : (
            <View style={[styles.channelAvatar, styles.thumbnailPlaceholder]}>
              <Tv size={22} color={COLORS.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <View style={[styles.typePill, styles.typePillChannel]}>
            <Text style={[styles.typeText, styles.typeTextChannel]}>Kanaal</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.channel} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.72}>
      <View style={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Play size={24} color={COLORS.textMuted} fill={COLORS.textMuted} />
          </View>
        )}
        {item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={[styles.typePill, item.type === 'playlist' && styles.typePillPlaylist]}>
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
  // Video / playlist thumbnail
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
  // Channel avatar
  channelAvatarWrap: {
    width: 96,
    height: 96,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  channelAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  // Shared info panel
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
  typePillPlaylist: {
    backgroundColor: '#F3E8FF',
  },
  typePillChannel: {
    backgroundColor: '#FFF3E0',
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
  typeTextChannel: {
    color: '#E65100',
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
    fontWeight: '400',
    lineHeight: 16,
  },
});
