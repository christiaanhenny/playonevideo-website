export type AppScreen =
  | 'Onboarding'
  | 'LockedHome'
  | 'ParentAuth'
  | 'Search'
  | 'VideoSetup'
  | 'Playback'
  | 'Finished'
  | 'DonationPrompt'
  | 'Settings'
  | 'FolderVideos'
  | 'ManageFolders'
  | 'PlaylistVideos'
  | 'ChannelVideos'
  | 'WatchHistory'
  | 'ChildSettings'
  | 'FamilySync'
  | 'Paywall';

export interface TimeSlot {
  enabled: boolean;
  startHour: number;   // 0–23
  startMinute: number; // 0 or 30
  endHour: number;
  endMinute: number;
}

export interface Folder {
  id: string;
  name: string;
  emoji: string;
  videos: VideoResult[];
  // child settings
  endMessage?: string;       // custom message shown on FinishedScreen
  dailyLimit?: number;       // 0 = unlimited, 1–5 = max videos per day
  timeSlot?: TimeSlot;       // optional viewing window
  themeKeyword?: string;     // theme for random video picker
}

export interface WatchHistoryEntry {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  watchedAt: number; // timestamp ms
  durationSeconds: number;
}

export interface Chapter {
  index: number;
  title: string;
  startSeconds: number;
  endSeconds: number;
}

export interface VideoResult {
  id: string;
  type: 'video' | 'playlist' | 'channel';
  title: string;
  channelName: string;
  thumbnail: string;
  duration?: string;
  durationSeconds?: number;
  description?: string;
  playlistId?: string;
  channelId?: string;
}

export interface PlaybackSegment {
  startSeconds: number;
  endSeconds: number;
}

export interface PlaybackConfig {
  video: VideoResult;
  segments: PlaybackSegment[];
  mode: 'full' | 'first_chapter' | 'custom';
}

export interface AppSettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  unlockTimeoutSeconds: number;
  donationPromptsEnabled: boolean;
  favouritesEnabled: boolean;
}

export type RootStackParamList = {
  Onboarding: undefined;
  LockedHome: undefined;
  ParentAuth: { returnTo: keyof RootStackParamList; returnParams?: object; forceSetup?: boolean; skipBiometric?: boolean };
  Search: { themeKeyword?: string } | undefined;
  VideoSetup: { video: VideoResult };
  Playback: { config: PlaybackConfig };
  Finished: undefined;
  DonationPrompt: undefined;
  Settings: undefined;
  FolderVideos: { folderId: string };
  ManageFolders: undefined;
  PlaylistVideos: { playlistId: string; title: string };
  ChannelVideos: { channelId: string; title: string; thumbnail?: string };
  WatchHistory: { folderId: string };
  ChildSettings: { folderId: string };
  FamilySync: undefined;
  Paywall: undefined;
};
