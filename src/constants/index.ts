export const COLORS = {
  background: '#F8F7FF',
  surface: '#FFFFFF',
  primary: '#4338CA',
  primaryLight: '#6366F1',
  primaryDark: '#3730A3',
  accent: '#F59E0B',
  accentLight: '#FDE68A',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444',
  overlay: 'rgba(0,0,0,0.5)',
  finishedBg: '#07071A',
};

export const FONTS = {
  regular: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
};

export const UNLOCK_TIMEOUT_MS = 60_000; // 60 seconds
export const PIN_COOLDOWN_MS = 30_000;   // 30 seconds after 3 failed attempts
export const MAX_PIN_ATTEMPTS = 3;
export const DONATION_INTERVAL = 5;      // every 5th app open
export const DONATION_SUPPRESS_AFTER_DISMISS = 5; // suppress 5 opens after dismiss
export const DONATION_SUPPRESS_AFTER_DONATE_DAYS = 30;

export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Replace with your YouTube Data API v3 key
export const YOUTUBE_API_KEY = 'AIzaSyDV_qrY7F__GuaB4GjkMawU7i1ktOokjr4';
