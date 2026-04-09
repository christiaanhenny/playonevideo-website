export const COLORS = {
  background: '#EFEFEF',
  surface: '#FFFFFF',
  primary: '#3A3A3A',     // dark grey — no color at all
  primaryLight: '#555555',
  primaryDark: '#1C1C1C',
  accent: '#8E8E93',
  accentLight: '#C7C7CC',
  textPrimary: '#111111',
  textSecondary: '#555555',
  textMuted: '#999999',
  border: '#D1D1D1',
  success: '#555555',
  error: '#CC0000',
  overlay: 'rgba(0,0,0,0.5)',
  finishedBg: '#111111',
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

export { YOUTUBE_API_KEY, OPENAI_API_KEY, REVENUECAT_API_KEY } from './secrets';

export const PREMIUM_ENTITLEMENT_ID = 'premium';
export const FREE_FOLDER_LIMIT = 1;
