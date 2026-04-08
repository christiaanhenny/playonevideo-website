export type AppScreen =
  | 'LockedHome'
  | 'ParentAuth'
  | 'Search'
  | 'VideoSetup'
  | 'Playback'
  | 'Finished'
  | 'DonationPrompt'
  | 'Settings'
  | 'FolderVideos'
  | 'ManageFolders';

export interface Folder {
  id: string;
  name: string;
  emoji: string;
  videos: VideoResult[];
}

export interface Chapter {
  index: number;
  title: string;
  startSeconds: number;
  endSeconds: number;
}

export interface VideoResult {
  id: string;
  type: 'video' | 'playlist';
  title: string;
  channelName: string;
  thumbnail: string;
  duration?: string; // ISO 8601 duration
  durationSeconds?: number;
  description?: string;
  playlistId?: string;
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
  LockedHome: undefined;
  ParentAuth: { returnTo: keyof RootStackParamList; returnParams?: object; forceSetup?: boolean };
  Search: undefined;
  VideoSetup: { video: VideoResult };
  Playback: { config: PlaybackConfig };
  Finished: undefined;
  DonationPrompt: undefined;
  Settings: undefined;
  FolderVideos: { folderId: string };
  ManageFolders: undefined;
};
