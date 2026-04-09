import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { AppState as RNAppState } from 'react-native';
import { UNLOCK_TIMEOUT_MS } from '../constants';
import { VideoResult } from '../types';
import { SyncService } from '../services/SyncService';
import { StorageService } from '../services/StorageService';
import { PremiumService } from '../services/PremiumService';

interface AppStateContextValue {
  isParentUnlocked: boolean;
  unlock: () => void;
  relock: () => void;
  resetUnlockTimer: () => void;
  activeChildId: string | null;
  setActiveChildId: (id: string | null) => void;
  lastPlayedVideo: VideoResult | null;
  setLastPlayedVideo: (v: VideoResult | null) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  refreshPremium: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue>({
  isParentUnlocked: false,
  unlock: () => {},
  relock: () => {},
  resetUnlockTimer: () => {},
  activeChildId: null,
  setActiveChildId: () => {},
  lastPlayedVideo: null,
  setLastPlayedVideo: () => {},
  isPremium: false,
  setIsPremium: () => {},
  refreshPremium: async () => {},
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [lastPlayedVideo, setLastPlayedVideo] = useState<VideoResult | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPremium = useCallback(async () => {
    const premium = await PremiumService.isPremium();
    setIsPremium(premium);
  }, []);

  useEffect(() => {
    refreshPremium();
  }, [refreshPremium]);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const relock = useCallback(() => {
    clearTimer();
    setIsParentUnlocked(false);
  }, []);

  const startUnlockTimer = useCallback(() => {
    clearTimer();
    timeoutRef.current = setTimeout(() => {
      setIsParentUnlocked(false);
    }, UNLOCK_TIMEOUT_MS);
  }, []);

  const unlock = useCallback(() => {
    setIsParentUnlocked(true);
    startUnlockTimer();
  }, [startUnlockTimer]);

  const resetUnlockTimer = useCallback(() => {
    if (isParentUnlocked) startUnlockTimer();
  }, [isParentUnlocked, startUnlockTimer]);

  // Relock when app goes to background for >30s
  const backgroundTimeRef = useRef<number | null>(null);
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') {
        backgroundTimeRef.current = Date.now();
      } else if (state === 'active') {
        if (backgroundTimeRef.current) {
          const elapsed = Date.now() - backgroundTimeRef.current;
          if (elapsed > 30_000) relock();
          backgroundTimeRef.current = null;
        }
      }
    });
    return () => sub.remove();
  }, [relock]);

  useEffect(() => () => clearTimer(), []);

  // Realtime sync: luister naar wijzigingen van het andere apparaat
  useEffect(() => {
    SyncService.subscribe(async (folders, favourites) => {
      // SyncService zet suppressPush=true zodat deze saves niet teruggestuurd worden
      await StorageService.saveFolders(folders);
      await StorageService.saveFavourites(favourites);
    });
    return () => SyncService.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppStateContext.Provider
      value={{ isParentUnlocked, unlock, relock, resetUnlockTimer, activeChildId, setActiveChildId, lastPlayedVideo, setLastPlayedVideo, isPremium, setIsPremium, refreshPremium }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
