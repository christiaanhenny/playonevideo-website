import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { AppSettings, Folder, VideoResult, WatchHistoryEntry } from '../types';
import { SyncService } from './SyncService';

const KEYS = {
  APP_OPEN_COUNT: 'app_open_count',
  LAST_DONATION_PROMPT: 'last_donation_prompt',
  LAST_DONATION_PROMPT_OPEN_COUNT: 'last_donation_prompt_open_count',
  LAST_DONATION: 'last_donation',
  DONATION_DISMISS_COUNT: 'donation_dismiss_count',
  SETTINGS: 'settings',
  FAVOURITES: 'favourites',
  RECENT_SEARCHES: 'recent_searches',
  FOLDERS: 'folders',
  PIN_SERVICE: 'ParentVideo.PIN',
  PIN_USERNAME: 'parent',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  LAST_REVIEW_PROMPT: 'last_review_prompt',
  TOTAL_VIDEOS_WATCHED: 'total_videos_watched',
};

const DEFAULT_SETTINGS: AppSettings = {
  biometricEnabled: true,
  pinEnabled: false,
  unlockTimeoutSeconds: 60,
  donationPromptsEnabled: true,
  favouritesEnabled: true,
};

export const StorageService = {
  // PIN (stored in Keychain)
  async savePin(pin: string): Promise<void> {
    await Keychain.setGenericPassword(KEYS.PIN_USERNAME, pin, {
      service: KEYS.PIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    });
  },

  async getPin(): Promise<string | null> {
    const result = await Keychain.getGenericPassword({ service: KEYS.PIN_SERVICE });
    if (result && result.password) return result.password;
    return null;
  },

  async hasPin(): Promise<boolean> {
    const pin = await StorageService.getPin();
    return pin !== null;
  },

  async clearPin(): Promise<void> {
    await Keychain.resetGenericPassword({ service: KEYS.PIN_SERVICE });
  },

  // Onboarding
  async getOnboardingComplete(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return val === 'true';
  },

  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
  },

  async resetOnboarding(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.ONBOARDING_COMPLETE);
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await StorageService.getSettings();
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  },

  // Donation tracking
  async getAppOpenCount(): Promise<number> {
    const val = await AsyncStorage.getItem(KEYS.APP_OPEN_COUNT);
    return val ? parseInt(val, 10) : 0;
  },

  async incrementAppOpenCount(): Promise<number> {
    const count = await StorageService.getAppOpenCount();
    const next = count + 1;
    await AsyncStorage.setItem(KEYS.APP_OPEN_COUNT, String(next));
    return next;
  },

  async getDonationDismissCount(): Promise<number> {
    const val = await AsyncStorage.getItem(KEYS.DONATION_DISMISS_COUNT);
    return val ? parseInt(val, 10) : 0;
  },

  async incrementDonationDismissCount(): Promise<void> {
    const count = await StorageService.getDonationDismissCount();
    await AsyncStorage.setItem(KEYS.DONATION_DISMISS_COUNT, String(count + 1));
  },

  async getLastDonationPromptTimestamp(): Promise<number | null> {
    const val = await AsyncStorage.getItem(KEYS.LAST_DONATION_PROMPT);
    return val ? parseInt(val, 10) : null;
  },

  async setLastDonationPromptTimestamp(): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_DONATION_PROMPT, String(Date.now()));
  },

  async getLastDonationPromptOpenCount(): Promise<number | null> {
    const val = await AsyncStorage.getItem(KEYS.LAST_DONATION_PROMPT_OPEN_COUNT);
    return val ? parseInt(val, 10) : null;
  },

  async setLastDonationPromptOpenCount(count: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_DONATION_PROMPT_OPEN_COUNT, String(count));
  },

  async getLastDonationTimestamp(): Promise<number | null> {
    const val = await AsyncStorage.getItem(KEYS.LAST_DONATION);
    return val ? parseInt(val, 10) : null;
  },

  async setLastDonationTimestamp(): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_DONATION, String(Date.now()));
  },

  // Favourites
  async getFavourites(): Promise<VideoResult[]> {
    const raw = await AsyncStorage.getItem(KEYS.FAVOURITES);
    return raw ? JSON.parse(raw) : [];
  },

  async saveFavourites(favourites: VideoResult[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.FAVOURITES, JSON.stringify(favourites));
    const folders = await StorageService.getFolders();
    await SyncService.pushLists(folders, favourites);
  },

  async addFavourite(video: VideoResult): Promise<void> {
    const favs = await StorageService.getFavourites();
    const exists = favs.find(f => f.id === video.id);
    if (!exists) {
      const updated = [video, ...favs];
      await AsyncStorage.setItem(KEYS.FAVOURITES, JSON.stringify(updated));
      const folders = await StorageService.getFolders();
      await SyncService.pushLists(folders, updated);
    }
  },

  async removeFavourite(videoId: string): Promise<void> {
    const favs = await StorageService.getFavourites();
    const updated = favs.filter(f => f.id !== videoId);
    await AsyncStorage.setItem(KEYS.FAVOURITES, JSON.stringify(updated));
    const folders = await StorageService.getFolders();
    await SyncService.pushLists(folders, updated);
  },

  // Recent searches
  async getRecentSearches(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEYS.RECENT_SEARCHES);
    return raw ? JSON.parse(raw) : [];
  },

  async addRecentSearch(query: string): Promise<void> {
    const searches = await StorageService.getRecentSearches();
    const filtered = searches.filter(s => s !== query);
    const updated = [query, ...filtered].slice(0, 10);
    await AsyncStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(updated));
  },

  async clearRecentSearches(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.RECENT_SEARCHES);
  },

  // Folders
  async getFolders(): Promise<Folder[]> {
    const raw = await AsyncStorage.getItem(KEYS.FOLDERS);
    return raw ? JSON.parse(raw) : [];
  },

  async saveFolders(folders: Folder[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.FOLDERS, JSON.stringify(folders));
    const favourites = await StorageService.getFavourites();
    await SyncService.pushLists(folders, favourites);
  },

  async createFolder(name: string, emoji: string): Promise<Folder> {
    const folders = await StorageService.getFolders();
    const folder: Folder = { id: Date.now().toString(), name, emoji, videos: [] };
    await StorageService.saveFolders([...folders, folder]);
    return folder;
  },

  async renameFolder(folderId: string, name: string, emoji: string): Promise<void> {
    const folders = await StorageService.getFolders();
    await StorageService.saveFolders(
      folders.map(f => f.id === folderId ? { ...f, name, emoji } : f),
    );
  },

  async updateFolderSettings(folderId: string, updates: Partial<Folder>): Promise<void> {
    const folders = await StorageService.getFolders();
    await StorageService.saveFolders(
      folders.map(f => f.id === folderId ? { ...f, ...updates } : f),
    );
  },

  async deleteFolder(folderId: string): Promise<void> {
    const folders = await StorageService.getFolders();
    await StorageService.saveFolders(folders.filter(f => f.id !== folderId));
    // Clean up related data
    const dateKey = new Date().toISOString().slice(0, 10);
    await AsyncStorage.removeItem(`daily_watch_${folderId}_${dateKey}`);
    await AsyncStorage.removeItem(`watch_history_${folderId}`);
  },

  async addVideoToFolder(folderId: string, video: VideoResult): Promise<void> {
    const folders = await StorageService.getFolders();
    await StorageService.saveFolders(folders.map(f => {
      if (f.id !== folderId) return f;
      if (f.videos.find(v => v.id === video.id)) return f;
      return { ...f, videos: [...f.videos, video] };
    }));
  },

  async removeVideoFromFolder(folderId: string, videoId: string): Promise<void> {
    const folders = await StorageService.getFolders();
    await StorageService.saveFolders(folders.map(f => {
      if (f.id !== folderId) return f;
      return { ...f, videos: f.videos.filter(v => v.id !== videoId) };
    }));
  },

  // Daily watch count (resets each calendar day)
  async getDailyWatchCount(folderId: string): Promise<number> {
    const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const val = await AsyncStorage.getItem(`daily_watch_${folderId}_${dateKey}`);
    return val ? parseInt(val, 10) : 0;
  },

  async incrementDailyWatchCount(folderId: string): Promise<number> {
    const dateKey = new Date().toISOString().slice(0, 10);
    const count = await StorageService.getDailyWatchCount(folderId);
    const next = count + 1;
    await AsyncStorage.setItem(`daily_watch_${folderId}_${dateKey}`, String(next));
    return next;
  },

  // Watch history (per child)
  async getWatchHistory(folderId: string): Promise<WatchHistoryEntry[]> {
    const raw = await AsyncStorage.getItem(`watch_history_${folderId}`);
    return raw ? JSON.parse(raw) : [];
  },

  async addWatchHistoryEntry(folderId: string, entry: WatchHistoryEntry): Promise<void> {
    const history = await StorageService.getWatchHistory(folderId);
    // Keep last 50 entries
    const updated = [entry, ...history].slice(0, 50);
    await AsyncStorage.setItem(`watch_history_${folderId}`, JSON.stringify(updated));
  },

  async clearWatchHistory(folderId: string): Promise<void> {
    await AsyncStorage.removeItem(`watch_history_${folderId}`);
  },

  // Review prompt tracking
  async getLastReviewPromptTimestamp(): Promise<number | null> {
    const val = await AsyncStorage.getItem(KEYS.LAST_REVIEW_PROMPT);
    return val ? parseInt(val, 10) : null;
  },

  async setLastReviewPromptTimestamp(): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_REVIEW_PROMPT, String(Date.now()));
  },

  async getTotalVideosWatched(): Promise<number> {
    const val = await AsyncStorage.getItem(KEYS.TOTAL_VIDEOS_WATCHED);
    return val ? parseInt(val, 10) : 0;
  },

  async incrementTotalVideosWatched(): Promise<number> {
    const count = await StorageService.getTotalVideosWatched();
    const next = count + 1;
    await AsyncStorage.setItem(KEYS.TOTAL_VIDEOS_WATCHED, String(next));
    return next;
  },
};
