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

interface AppStateContextValue {
  isParentUnlocked: boolean;
  unlock: () => void;
  relock: () => void;
  resetUnlockTimer: () => void;
}

const AppStateContext = createContext<AppStateContextValue>({
  isParentUnlocked: false,
  unlock: () => {},
  relock: () => {},
  resetUnlockTimer: () => {},
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <AppStateContext.Provider value={{ isParentUnlocked, unlock, relock, resetUnlockTimer }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
